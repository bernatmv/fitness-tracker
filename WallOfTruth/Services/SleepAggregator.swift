import Foundation

/// Turns raw "asleep" intervals into minutes slept per night.
///
/// Sleep samples overlap when several sources (watch, phone, apps) record
/// the same night and a night is split into many stage samples, so summing
/// samples double-counts. Intervals are unioned first, grouped into
/// sessions, and each session is credited to the day it ends — the morning
/// you wake up, which is how Apple Health labels a night.
enum SleepAggregator {
    /// Gaps up to this long still belong to the same session.
    static let sessionGap: TimeInterval = 60 * 60

    static func minutesPerDay(_ intervals: [DateInterval], timeZone: TimeZone = .current) -> [Day: Double] {
        var result: [Day: Double] = [:]
        for session in sessions(union(intervals)) {
            let minutes = session.reduce(0) { $0 + $1.duration } / 60
            result[Day(session.last!.end, timeZone: timeZone), default: 0] += minutes
        }
        return result
    }

    static func union(_ intervals: [DateInterval]) -> [DateInterval] {
        var merged: [DateInterval] = []
        for interval in intervals.sorted(by: { $0.start < $1.start }) {
            if let last = merged.last, interval.start <= last.end {
                merged[merged.count - 1] = DateInterval(start: last.start, end: max(last.end, interval.end))
            } else {
                merged.append(interval)
            }
        }
        return merged
    }

    private static func sessions(_ merged: [DateInterval]) -> [[DateInterval]] {
        var sessions: [[DateInterval]] = []
        for interval in merged {
            if let last = sessions.last?.last, interval.start.timeIntervalSince(last.end) <= sessionGap {
                sessions[sessions.count - 1].append(interval)
            } else {
                sessions.append([interval])
            }
        }
        return sessions
    }
}
