import Foundation

/// Apple-ring stand hours per day. Several sources (two watches, a
/// re-paired watch) can each write the same hour, so hours are counted
/// once per clock hour.
enum StandHours {
    static func perDay(_ starts: [Date], timeZone: TimeZone = .current) -> [Day: Double] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        var hours: [Day: Set<Int>] = [:]
        for start in starts {
            hours[Day(start, timeZone: timeZone), default: []].insert(calendar.component(.hour, from: start))
        }
        return hours.mapValues { Double($0.count) }
    }
}
