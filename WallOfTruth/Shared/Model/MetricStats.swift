import Foundation

/// Summary numbers for a metric over a range of days.
struct MetricStats: Equatable, Sendable {
    var currentStreak = 0
    var bestStreak = 0
    var average = 0.0
    var best: (day: Day, value: Double)?
    var total = 0.0
    var daysWithData = 0
    var daysMeetingGoal = 0

    static func == (lhs: MetricStats, rhs: MetricStats) -> Bool {
        lhs.currentStreak == rhs.currentStreak && lhs.bestStreak == rhs.bestStreak
            && lhs.average == rhs.average && lhs.best?.day == rhs.best?.day
            && lhs.best?.value == rhs.best?.value && lhs.total == rhs.total
            && lhs.daysWithData == rhs.daysWithData && lhs.daysMeetingGoal == rhs.daysMeetingGoal
    }

    /// Goal rate over days that have data.
    var goalRate: Double { daysWithData == 0 ? 0 : Double(daysMeetingGoal) / Double(daysWithData) }

    /// Totals and averages cover `range`; streaks cover all history so a
    /// long streak is never cut at the range edge.
    /// - Parameter today: Today is still in progress, so an unmet today does
    ///   not break the current streak.
    init(series: DaySeries, scale: ThresholdScale, range: ClosedRange<Day>, today: Day = .today) {
        guard !series.isEmpty else { return }
        var day = range.lowerBound
        while day <= range.upperBound {
            let value = series[day]
            if value > 0 {
                daysWithData += 1
                total += value
                if value > (best?.value ?? 0) { best = (day, value) }
            }
            if scale.meetsGoal(value) { daysMeetingGoal += 1 }
            day = day.advanced(by: 1)
        }
        average = daysWithData == 0 ? 0 : total / Double(daysWithData)

        var run = 0
        for value in series.values {
            run = scale.meetsGoal(value) ? run + 1 : 0
            bestStreak = max(bestStreak, run)
        }
        var cursor = scale.meetsGoal(series[today]) ? today : today.advanced(by: -1)
        while cursor >= series.start, scale.meetsGoal(series[cursor]) {
            currentStreak += 1
            cursor = cursor.advanced(by: -1)
        }
    }

    init() {}
}
