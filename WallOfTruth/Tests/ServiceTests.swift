import Foundation
import Testing
@testable import WallOfTruth

struct AccessTests {
    @Test func freeUnlocksOnlyCalories() {
        #expect(Access.free.canView(.calories))
        for metric in Metric.allCases where metric != .calories {
            #expect(!Access.free.canView(metric))
        }
        #expect(Access.free.showsUpsell)
    }

    @Test func proSeesEverythingAndNoUpsell() {
        #expect(Metric.allCases.allSatisfy { Access.pro.canView($0) })
        #expect(!Access.pro.showsUpsell)
    }

    /// Builds before 2.0 cached a keyed enum ({"pro":{}}, {"trial":{...}}).
    @Test func decodesTheOldCachedFormat() throws {
        func decode(_ json: String) throws -> Access { try JSONDecoder().decode(Access.self, from: Data(json.utf8)) }
        #expect(try decode(#"{"pro":{}}"#) == .pro)
        #expect(try decode(#"{"free":{}}"#) == .free)
        #expect(try decode(#"{"trial":{"endsAt":800000000}}"#) == .free)
        #expect(try decode(#""pro""#) == .pro)
    }

    @Test func cachedValueSurvivesEncoding() throws {
        let decoded = try JSONDecoder().decode(Access.self, from: JSONEncoder().encode(Access.pro))
        #expect(decoded == .pro)
    }
}

struct LegacyMigrationTests {
    @Test func mapsThresholdsPalettesAndFlags() throws {
        let json = """
        {"language":"en","theme":"dark","onboardingCompleted":true,"metricConfigs":{
          "CALORIES_BURNED":{"metricType":"CALORIES_BURNED","enabled":true,"displayName":"Calories",
            "colorRange":{"thresholds":[0,500,650,800,1000],"paletteId":"sunset_orange"}},
          "STEPS":{"metricType":"STEPS","enabled":false,"displayName":"Steps",
            "colorRange":{"thresholds":[0,3000,6000,10000,15000],"paletteId":"github_green"}},
          "UNKNOWN":{"enabled":true}
        }}
        """
        let prefs = try #require(LegacyMigration.preferences(fromLegacyJSON: Data(json.utf8)))
        #expect(prefs.theme == .dark)
        #expect(prefs.onboardingCompleted)
        #expect(prefs[.calories].thresholds == [500, 650, 800, 1000])
        #expect(prefs[.calories].paletteID == "orange")
        #expect(prefs[.steps].enabled == false)
        #expect(prefs[.steps].paletteID == "green")
        #expect(prefs[.sleep] == .defaults(for: .sleep))
    }

    @Test func sleepThresholdsSavedInHoursBecomeMinutes() throws {
        let json = #"{"metricConfigs":{"SLEEP_HOURS":{"colorRange":{"thresholds":[0,5,6,7,8],"paletteId":"ios_health_purple"}}}}"#
        let prefs = try #require(LegacyMigration.preferences(fromLegacyJSON: Data(json.utf8)))
        #expect(prefs[.sleep].thresholds == [300, 360, 420, 480])
    }

    @Test func garbageIsIgnored() {
        #expect(LegacyMigration.preferences(fromLegacyJSON: Data("nope".utf8)) == nil)
    }
}

struct PreferencesTests {
    @Test func decodesOlderSavesWithMissingFields() throws {
        let prefs = try JSONDecoder().decode(Preferences.self, from: Data(#"{"theme":"light"}"#.utf8))
        #expect(prefs.theme == .light)
        #expect(prefs.orderedMetrics == Metric.allCases)
        #expect(prefs[.steps] == .defaults(for: .steps))
    }

    @Test func roundTrips() throws {
        var prefs = Preferences()
        prefs[.sleep].paletteID = "rose"
        prefs.wallStyle = .month
        let decoded = try JSONDecoder().decode(Preferences.self, from: JSONEncoder().encode(prefs))
        #expect(decoded == prefs)
    }
}

struct ReviewStateTests {
    let d = Day(year: 2026, month: 1, day: 1)

    @Test func asksAfterThreeDistinctDays() {
        var state = ReviewState().recording(d).recording(d)
        #expect(!state.shouldAsk(today: d))
        state = state.recording(d.advanced(by: 1)).recording(d.advanced(by: 5))
        #expect(state.shouldAsk(today: d.advanced(by: 5)))
    }

    @Test func respectsCooldownAndCap() {
        var state = ReviewState(activeDays: [d, d.advanced(by: 1), d.advanced(by: 2)], lastAsked: d.advanced(by: 2), askCount: 1)
        #expect(!state.shouldAsk(today: d.advanced(by: 100)))
        #expect(state.shouldAsk(today: d.advanced(by: 122)))
        state.askCount = 3
        #expect(!state.shouldAsk(today: d.advanced(by: 400)))
    }
}

struct HistorySyncTests {
    let today = Day(year: 2026, month: 10, day: 4)

    @Test func firstSyncFetchesAboutAYear() {
        let range = HistorySync.refreshRange(state: SyncState(), today: today)
        #expect(range.upperBound == today)
        #expect(range.lowerBound.distance(to: today) == HistorySync.firstPaintDays - 1)
    }

    @Test func laterSyncsRefreshRecentWindow() {
        let state = SyncState(oldestFetched: today.advanced(by: -399), lastSync: today.advanced(by: -2).date())
        let range = HistorySync.refreshRange(state: state, today: today)
        #expect(range.lowerBound == today.advanced(by: -2 - HistorySync.refreshWindow))
    }

    @Test func backfillStopsAtEarliestData() {
        let state = SyncState(oldestFetched: today.advanced(by: -399), lastSync: Date())
        let range = HistorySync.backfillRange(state: state, earliest: today.advanced(by: -1000), today: today)
        #expect(range == today.advanced(by: -1000)...today.advanced(by: -400))
        let done = SyncState(oldestFetched: today.advanced(by: -1000), lastSync: Date())
        #expect(HistorySync.backfillRange(state: done, earliest: today.advanced(by: -1000), today: today) == nil)
    }

    @Test func fetchFillsGapsWithZeros() async {
        let sync = HistorySync(source: DemoHealthSource())
        let range = today.advanced(by: -3)...today
        let result = await sync.fetch([.steps], range: range)
        #expect(result[.steps]?.count == 4)
    }
}

struct WidgetSnapshotTests {
    @Test func trimsToRecentDays() {
        let today = Day(year: 2026, month: 10, day: 4)
        var series = DaySeries.empty
        series.merge([today.advanced(by: -2000): 1, today: 5])
        let snapshot = WidgetSnapshot.make(preferences: Preferences(), histories: [.steps: series], access: .free, today: today)
        #expect(snapshot.entries[.steps]?.series.values.count == WidgetSnapshot.days)
        #expect(snapshot.entries[.steps]?.series[today] == 5)
        #expect(snapshot.entries[.sleep]?.series.values.allSatisfy { $0 == 0 } == true)
    }
}

struct FormatTests {
    @Test func formatsWithLocale() {
        let en = Locale(identifier: "en_US")
        #expect(MetricFormat.number(12345, for: .steps, locale: en) == "12,345")
        #expect(MetricFormat.compact(12_400, for: .steps, locale: en) == "12.4K")
        #expect(MetricFormat.value(450, for: .sleep).contains("7"))
    }
}

struct HomeStatusTests {
    @Test func explainsEmptyWalls() {
        #expect(HomeStatus.resolve(hasData: true, isSyncing: true, hasSynced: true) == nil)
        #expect(HomeStatus.resolve(hasData: false, isSyncing: true, hasSynced: false) == .loading)
        #expect(HomeStatus.resolve(hasData: false, isSyncing: false, hasSynced: false) == .loading)
        #expect(HomeStatus.resolve(hasData: false, isSyncing: false, hasSynced: true) == .noData)
    }
}

struct ThresholdInputTests {
    let en = Locale(identifier: "en_US"), es = Locale(identifier: "es_ES")

    @Test func parsesLocaleNumbersAndSleepHours() {
        #expect(ThresholdInput.parse("12,500", for: .steps, locale: en) == 12_500)
        #expect(ThresholdInput.parse("12500", for: .steps, locale: es) == 12_500)
        #expect(ThresholdInput.parse("7,5", for: .sleep, locale: es) == 450)
        #expect(ThresholdInput.parse("7.5", for: .sleep, locale: en) == 450)
        #expect(ThresholdInput.parse("abc", for: .steps, locale: en) == nil)
        #expect(ThresholdInput.parse("-3", for: .floors, locale: en) == nil)
    }

    @Test func editableTextRoundTrips() {
        #expect(ThresholdInput.editableText(450, for: .sleep, locale: en) == "7.5")
        #expect(ThresholdInput.parse(ThresholdInput.editableText(10_000, for: .steps, locale: es), for: .steps, locale: es) == 10_000)
    }
}

struct MigrateOnceTests {
    @Test func runsOnceAndDropsOldCaches() {
        let suite = UserDefaults(suiteName: "legacy-\(UUID())")!
        let local = UserDefaults(suiteName: "local-\(UUID())")!
        suite.set(#"{"theme":"dark"}"#, forKey: LegacyMigration.preferencesKey)
        suite.set("huge", forKey: "@fitness_tracker:health_data")
        #expect(LegacyMigration.migrateOnce(defaults: suite, local: local)?.theme == .dark)
        #expect(suite.string(forKey: "@fitness_tracker:health_data") == nil)
        #expect(LegacyMigration.migrateOnce(defaults: suite, local: local) == nil)
    }
}
