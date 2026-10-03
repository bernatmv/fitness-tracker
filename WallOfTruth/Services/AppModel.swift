import Foundation
import SwiftUI
import WidgetKit

/// App-wide state: settings, histories and sync. Views read from it and
/// call its intents; persistence and widget refreshes happen here.
@MainActor
@Observable
final class AppModel {
    var preferences: Preferences {
        didSet {
            guard preferences != oldValue else { return }
            SharedContainer.write(preferences, to: FileName.preferences)
            publishWidgetSnapshot()
        }
    }
    private(set) var histories: [Metric: DaySeries] = [:]
    private(set) var isSyncing = false
    /// A refresh was requested while one was running; run once more after.
    private var pendingRefresh = false
    /// Counts finished quick passes (recent days), so callers can wait for
    /// fresh data without waiting for a multi-year backfill.
    private(set) var quickPasses = 0
    private(set) var syncState = SyncState.load()
    let purchases: PurchaseManager
    private let sync: HistorySync

    init(source: HealthSource = DebugFlags.demoData ? DemoHealthSource() : HealthKitSource()) {
        sync = HistorySync(source: source)
        purchases = PurchaseManager()
        if let saved = SharedContainer.read(Preferences.self, from: FileName.preferences) {
            preferences = saved
        } else if let migrated = LegacyMigration.migrateOnce() {
            preferences = migrated
            SharedContainer.write(migrated, to: FileName.preferences)
        } else {
            preferences = Preferences()
        }
        if DebugFlags.skipOnboarding { preferences.onboardingCompleted = true }
        if DebugFlags.resetOnboarding { preferences.onboardingCompleted = false }
        if DebugFlags.resetData {
            syncState = SyncState()
            for metric in Metric.allCases { SharedContainer.remove(FileName.history(metric)) }
        }
        var historyMissing = false
        for metric in Metric.allCases {
            let stored = SharedContainer.read(DaySeries.self, from: FileName.history(metric))
            historyMissing = historyMissing || stored == nil
            histories[metric] = stored ?? .empty
        }
        // A missing or corrupt history file would otherwise never be refetched.
        if historyMissing, syncState.oldestFetched != nil {
            syncState = SyncState()
            syncState.save()
        }
        purchases.onAccessChange = { [weak self] _ in self?.publishWidgetSnapshot() }
        startObservingHealth()
    }

    /// Background delivery only works once Health access was requested.
    func startObservingHealth() {
        guard preferences.onboardingCompleted, let healthKit = sync.source as? HealthKitSource, !isObserving else { return }
        isObserving = true
        HealthObserver.start(store: healthKit.store) { [weak self] in await self?.refresh() }
    }
    private var isObserving = false

    var access: Access { purchases.access }

    var visibleMetrics: [Metric] {
        preferences.orderedMetrics.filter { preferences[$0].enabled }
    }

    func history(_ metric: Metric) -> DaySeries { histories[metric] ?? .empty }

    var hasAnyData: Bool { histories.values.contains { $0.lastDayWithData != nil } }

    func requestHealthAccess() async {
        try? await sync.source.requestAuthorization()
    }

    /// Quick refresh of recent days, then a backfill of older history.
    /// Returns once the data is synced, including a sync already running, so
    /// background delivery can report completion honestly.
    func refresh() async {
        guard !isSyncing else {
            pendingRefresh = true
            while isSyncing { try? await Task.sleep(for: .milliseconds(250)) }
            return
        }
        isSyncing = true
        defer { isSyncing = false }
        repeat {
            pendingRefresh = false
            await syncOnce()
        } while pendingRefresh
    }

    private func syncOnce() async {
        // Asks only for types not asked before (e.g. stand hours for people
        // upgrading from the React Native app); otherwise returns at once.
        if !didRequestAccess, preferences.onboardingCompleted {
            didRequestAccess = true
            await requestHealthAccess()
        }
        // Nothing on record (e.g. Health access was granted after an empty
        // first sync): read history from scratch, not just recent days.
        if !hasAnyData, syncState.lastSync != nil { syncState = SyncState() }
        let today = Day.today
        let range = HistorySync.refreshRange(state: syncState, today: today)
        let refreshed = apply(await sync.fetch(Metric.allCases, range: range), covering: range)
        quickPasses += 1
        guard refreshed else { return }
        // Backfill only in the foreground, a year at a time, newest first.
        while UIApplication.shared.applicationState != .background,
              let older = HistorySync.backfillRange(state: syncState, earliest: sync.source.earliestDay(), today: today) {
            let chunk = max(older.lowerBound, older.upperBound.advanced(by: -364))...older.upperBound
            guard apply(await sync.fetch(Metric.allCases, range: chunk), covering: chunk) else { return }
        }
    }
    private var didRequestAccess = false

    /// Pull to refresh: returns once recent days are in, while any
    /// backfill continues on its own.
    func refreshRecent() async {
        // A sync already running includes recent days; don't hold the spinner.
        guard !isSyncing else { return }
        let start = quickPasses
        Task { await refresh() }
        let deadline = ContinuousClock.now + .seconds(20)
        while quickPasses == start, ContinuousClock.now < deadline {
            try? await Task.sleep(for: .milliseconds(200))
        }
    }

    /// Bounded wait for the first quick pass of this launch.
    func waitForFirstPass(timeout: Duration = .seconds(15)) async {
        let deadline = ContinuousClock.now + timeout
        while quickPasses == 0, ContinuousClock.now < deadline {
            try? await Task.sleep(for: .milliseconds(200))
        }
    }

    /// Re-reads all history from Health, e.g. after granting more permissions.
    func resyncAll() async {
        syncState = SyncState()
        syncState.save()
        await refresh()
    }

    /// Merges what was fetched. Sync progress only moves forward when every
    /// metric succeeded, so a failed one is retried instead of left with gaps.
    @discardableResult
    private func apply(_ fetched: [Metric: [Day: Double]], covering range: ClosedRange<Day>) -> Bool {
        for (metric, values) in fetched {
            var series = histories[metric] ?? .empty
            series.merge(values)
            histories[metric] = series
            SharedContainer.write(series, to: FileName.history(metric))
        }
        if !fetched.isEmpty { publishWidgetSnapshot() }
        guard fetched.count == Metric.allCases.count else { return false }
        syncState.oldestFetched = min(syncState.oldestFetched ?? range.lowerBound, range.lowerBound)
        syncState.lastSync = Date()
        syncState.save()
        return true
    }

    /// Writes the widget payload and reloads widgets, but only when what
    /// they show changed: WidgetKit's daily reload budget is limited.
    func publishWidgetSnapshot() {
        let snapshot = WidgetSnapshot.make(preferences: preferences, histories: histories, access: access)
        guard snapshot.content != lastPublished else { return }
        lastPublished = snapshot.content
        snapshot.save()
        WidgetCenter.shared.reloadAllTimelines()
    }
    private var lastPublished: WidgetSnapshot.Content?

    func update(_ metric: Metric, _ change: (inout MetricSettings) -> Void) {
        var settings = preferences[metric]
        change(&settings)
        preferences[metric] = settings
    }
}
