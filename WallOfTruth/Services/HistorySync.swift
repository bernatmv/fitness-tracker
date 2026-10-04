import Foundation
import os

/// What has been fetched so far, so later launches only refresh recent days.
struct SyncState: Codable, Equatable, Sendable {
    var oldestFetched: Day?
    var lastSync: Date?

    static func load() -> SyncState { SharedContainer.read(SyncState.self, from: "sync_state_v2.json") ?? SyncState() }
    func save() { SharedContainer.write(self, to: "sync_state_v2.json") }
}

/// Fetches daily values for several metrics in parallel and merges them
/// into stored histories.
struct HistorySync: Sendable {
    let source: HealthSource
    static let log = Logger(subsystem: "com.bernat.wall-of-truth", category: "Sync")

    /// Recently written days can still change (late watch syncs), so every
    /// refresh re-reads this many trailing days.
    static let refreshWindow = 7
    /// First paint fetches about a year; older history follows in the background.
    static let firstPaintDays = 400
    static let maxYears = 10

    /// Range of a quick refresh given what was fetched before.
    static func refreshRange(state: SyncState, today: Day) -> ClosedRange<Day> {
        guard let lastSync = state.lastSync, state.oldestFetched != nil else {
            return today.advanced(by: -(firstPaintDays - 1))...today
        }
        let from = min(Day(lastSync), today).advanced(by: -refreshWindow)
        return from...today
    }

    /// Older range still missing, if any.
    static func backfillRange(state: SyncState, earliest: Day?, today: Day) -> ClosedRange<Day>? {
        let floor = max(earliest ?? today.advanced(by: -maxYears * 365), today.advanced(by: -maxYears * 365))
        guard let oldest = state.oldestFetched, oldest > floor else { return nil }
        return floor...oldest.advanced(by: -1)
    }

    func fetch(_ metrics: [Metric], range: ClosedRange<Day>) async -> [Metric: [Day: Double]] {
        await withTaskGroup(of: (Metric, [Day: Double]?).self) { group in
            for metric in metrics {
                group.addTask {
                    do {
                        return (metric, try await source.daily(metric, from: range.lowerBound, through: range.upperBound))
                    } catch {
                        HistorySync.log.error("Fetching \(metric.rawValue, privacy: .public) failed: \(error.localizedDescription, privacy: .public)")
                        return (metric, nil)
                    }
                }
            }
            var result: [Metric: [Day: Double]] = [:]
            for await (metric, values) in group {
                guard let values else { continue }
                // Keep only the requested days (boundary buckets can spill
                // over) and fill zeros so days that lost data are cleared.
                var filled = values.filter { range.contains($0.key) }
                var day = range.lowerBound
                while day <= range.upperBound {
                    if filled[day] == nil { filled[day] = 0 }
                    day = day.advanced(by: 1)
                }
                result[metric] = filled
            }
            return result
        }
    }
}
