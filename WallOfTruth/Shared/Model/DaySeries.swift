import Foundation

/// One value per day over a contiguous range, stored densely so lookups are
/// an array index and files stay small. Days without data read as 0.
struct DaySeries: Codable, Equatable, Sendable {
    private(set) var start: Day
    private(set) var values: [Double]

    init(start: Day = .today, values: [Double] = []) {
        self.start = start
        self.values = values
    }

    static let empty = DaySeries()

    var isEmpty: Bool { values.isEmpty }
    var end: Day { start.advanced(by: max(values.count - 1, 0)) }

    subscript(day: Day) -> Double {
        let index = start.distance(to: day)
        return values.indices.contains(index) ? values[index] : 0
    }

    /// Writes daily values, growing the range as needed. Fetched days fully
    /// replace stored ones: HealthKit is the source of truth.
    mutating func merge(_ daily: [Day: Double]) {
        guard let minDay = daily.keys.min(), let maxDay = daily.keys.max() else { return }
        let newStart = isEmpty ? minDay : min(start, minDay)
        let newEnd = isEmpty ? maxDay : max(end, maxDay)
        if newStart != start || newEnd != end || isEmpty {
            var grown = [Double](repeating: 0, count: newStart.distance(to: newEnd) + 1)
            let offset = newStart.distance(to: start)
            for (i, value) in values.enumerated() { grown[offset + i] = value }
            values = grown
            start = newStart
        }
        for (day, value) in daily { values[start.distance(to: day)] = value }
    }

    /// The trailing `days` days ending at `end`, for small widget payloads.
    func suffix(days: Int, endingAt last: Day) -> DaySeries {
        let first = last.advanced(by: -(days - 1))
        let slice = (0..<days).map { self[first.advanced(by: $0)] }
        return DaySeries(start: first, values: slice)
    }

    func values(in range: ClosedRange<Day>) -> [Double] {
        (0...range.lowerBound.distance(to: range.upperBound)).map { self[range.lowerBound.advanced(by: $0)] }
    }

    /// Day with data (> 0) closest to today, if any.
    var lastDayWithData: Day? {
        values.lastIndex { $0 > 0 }.map { start.advanced(by: $0) }
    }

    var firstDayWithData: Day? {
        values.firstIndex { $0 > 0 }.map { start.advanced(by: $0) }
    }
}
