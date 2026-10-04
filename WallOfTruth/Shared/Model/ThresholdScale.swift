import Foundation

/// Maps a day's value to one of the colored ranges.
///
/// `bounds` holds the lower edge of ranges 1…4, ascending. Values below the
/// first bound are level 0 ("not met"); a value at or above `bounds[i]`
/// reaches level `i + 1`. This matches the React Native app, where the
/// thresholds `[0, a, b, c, d]` meant `[0, a)` → empty, `[a, b)` → shade 1, …
struct ThresholdScale: Equatable, Sendable {
    static let levelCount = 5

    let bounds: [Double]

    init(_ bounds: [Double]) {
        self.bounds = ThresholdScale.normalized(bounds)
    }

    func level(for value: Double) -> Int {
        guard value > 0 else { return 0 }
        return bounds.lastIndex { value >= $0 }.map { $0 + 1 } ?? 0
    }

    /// Whether the value reaches the first range — the daily goal.
    func meetsGoal(_ value: Double) -> Bool { level(for: value) >= 1 }

    var goal: Double { bounds.first ?? 0 }

    /// "Truth beyond the wall": 50% past the top range.
    func isExceptional(_ value: Double) -> Bool {
        guard let top = bounds.last, top > 0 else { return false }
        return value >= top * 1.5
    }

    /// Lower and upper edge of a level, `nil` upper means open-ended.
    func range(of level: Int) -> (lower: Double, upper: Double?) {
        switch level {
        case ...0: (0, bounds.first)
        case 1..<bounds.count: (bounds[level - 1], bounds[level])
        default: (bounds.last ?? 0, nil)
        }
    }

    /// Moves one bound by `delta`, staying a step clear of its neighbours.
    static func adjusting(_ bounds: [Double], index: Int, by delta: Double, step: Double) -> [Double] {
        guard bounds.indices.contains(index) else { return bounds }
        var result = bounds
        let lower = index > 0 ? bounds[index - 1] + step : step
        let upper = index < bounds.count - 1 ? bounds[index + 1] - step : .greatestFiniteMagnitude
        result[index] = min(max(bounds[index] + delta, lower), upper)
        return result
    }

    /// Exactly four strictly ascending, positive bounds. Repairs bad input
    /// instead of rejecting it so a corrupt setting can never break a wall.
    static func normalized(_ raw: [Double]) -> [Double] {
        var values = raw.filter { $0.isFinite && $0 > 0 }.sorted()
        if values.isEmpty { values = [1] }
        while values.count < 4 { values.append((values.last ?? 1) + max(values.last ?? 1, 1) * 0.25) }
        values = Array(values.prefix(4))
        for i in 1..<values.count where values[i] <= values[i - 1] {
            values[i] = values[i - 1] + max(values[i - 1] * 0.01, 1)
        }
        return values
    }
}
