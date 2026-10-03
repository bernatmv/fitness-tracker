import Foundation
import Testing
@testable import WallOfTruth

struct DayTests {
    @Test func roundTripsCivilDates() {
        for (y, m, d) in [(1970, 1, 1), (2000, 2, 29), (2024, 12, 31), (2026, 3, 1), (1999, 7, 15)] {
            let day = Day(year: y, month: m, day: d)
            #expect(day.year == y && day.month == m && day.day == d)
        }
        #expect(Day(year: 1970, month: 1, day: 1).id == 0)
    }

    @Test func weekdayMatchesCalendar() {
        // 2026-10-04 is a Sunday.
        #expect(Day(year: 2026, month: 10, day: 4).weekday == 1)
        #expect(Day(year: 2026, month: 10, day: 10).weekday == 7)
    }

    @Test func sameLocalDayAcrossTimes() {
        let tz = TimeZone(identifier: "Europe/Madrid")!
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = tz
        let morning = calendar.date(from: DateComponents(year: 2026, month: 3, day: 29, hour: 0, minute: 30))!
        let night = calendar.date(from: DateComponents(year: 2026, month: 3, day: 29, hour: 23, minute: 59))!
        #expect(Day(morning, timeZone: tz) == Day(night, timeZone: tz))
        #expect(Day(year: 2026, month: 3, day: 29).date(timeZone: tz) == calendar.startOfDay(for: night))
    }

    @Test func monthMath() {
        let day = Day(year: 2024, month: 1, day: 31)
        #expect(day.adding(months: 1) == Day(year: 2024, month: 2, day: 1))
        #expect(day.adding(months: -1) == Day(year: 2023, month: 12, day: 1))
        #expect(Day(year: 2024, month: 2, day: 10).daysInMonth == 29)
        #expect(Day(year: 2025, month: 2, day: 10).daysInMonth == 28)
    }

    @Test func startOfWeekRespectsFirstWeekday() {
        let wednesday = Day(year: 2026, month: 10, day: 7)
        #expect(wednesday.startOfWeek(firstWeekday: 1) == Day(year: 2026, month: 10, day: 4))
        #expect(wednesday.startOfWeek(firstWeekday: 2) == Day(year: 2026, month: 10, day: 5))
        let sunday = Day(year: 2026, month: 10, day: 4)
        #expect(sunday.startOfWeek(firstWeekday: 2) == Day(year: 2026, month: 9, day: 28))
    }
}

struct ThresholdScaleTests {
    let scale = ThresholdScale([700, 850, 1000, 1200])

    @Test func levelsMatchLegacyRanges() {
        #expect(scale.level(for: 0) == 0)
        #expect(scale.level(for: 699) == 0)
        #expect(scale.level(for: 700) == 1)
        #expect(scale.level(for: 849.9) == 1)
        #expect(scale.level(for: 850) == 2)
        #expect(scale.level(for: 1000) == 3)
        #expect(scale.level(for: 1199) == 3)
        #expect(scale.level(for: 1200) == 4)
        #expect(scale.level(for: 99_999) == 4)
    }

    @Test func goalAndExceptional() {
        #expect(scale.goal == 700)
        #expect(!scale.meetsGoal(699) && scale.meetsGoal(700))
        #expect(!scale.isExceptional(1799) && scale.isExceptional(1800))
    }

    @Test func repairsBadInput() {
        #expect(ThresholdScale([10, 5, 5, -1, .nan]).bounds.count == 4)
        let repaired = ThresholdScale([10, 5, 5]).bounds
        #expect(repaired == repaired.sorted() && Set(repaired).count == 4)
        #expect(ThresholdScale([]).bounds.count == 4)
    }

    @Test func rangeEdges() {
        #expect(scale.range(of: 0).upper == 700)
        #expect(scale.range(of: 2).lower == 850 && scale.range(of: 2).upper == 1000)
        #expect(scale.range(of: 4).lower == 1200 && scale.range(of: 4).upper == nil)
    }
}

struct DaySeriesTests {
    let d0 = Day(year: 2026, month: 1, day: 10)

    @Test func mergeGrowsBothWaysAndReplaces() {
        var series = DaySeries.empty
        series.merge([d0: 5, d0.advanced(by: 2): 7])
        #expect(series[d0] == 5 && series[d0.advanced(by: 1)] == 0 && series[d0.advanced(by: 2)] == 7)
        series.merge([d0.advanced(by: -3): 1, d0: 9])
        #expect(series.start == d0.advanced(by: -3))
        #expect(series[d0] == 9 && series[d0.advanced(by: 2)] == 7 && series[d0.advanced(by: -3)] == 1)
        #expect(series[d0.advanced(by: 100)] == 0)
    }

    @Test func suffixPadsMissingDays() {
        var series = DaySeries.empty
        series.merge([d0: 3])
        let tail = series.suffix(days: 5, endingAt: d0.advanced(by: 2))
        #expect(tail.values == [0, 0, 3, 0, 0])
    }

    @Test func codableRoundTrip() throws {
        var series = DaySeries.empty
        series.merge([d0: 1.5, d0.advanced(by: 1): 2])
        let decoded = try JSONDecoder().decode(DaySeries.self, from: JSONEncoder().encode(series))
        #expect(decoded == series)
    }
}

struct MetricStatsTests {
    @Test func streaksAndAverages() {
        let today = Day(year: 2026, month: 10, day: 4)
        var series = DaySeries.empty
        // 5 days: met, met, miss, met, met(today)
        series.merge([today.advanced(by: -4): 10, today.advanced(by: -3): 12, today.advanced(by: -2): 1,
                      today.advanced(by: -1): 10, today: 11])
        let stats = MetricStats(series: series, scale: ThresholdScale([10, 20, 30, 40]), range: today.advanced(by: -4)...today, today: today)
        #expect(stats.currentStreak == 2)
        #expect(stats.bestStreak == 2)
        #expect(stats.daysMeetingGoal == 4 && stats.daysWithData == 5)
        #expect(stats.best?.value == 12)
        #expect(abs(stats.average - 44.0 / 5) < 0.0001)
    }

    @Test func unfinishedTodayDoesNotBreakStreak() {
        let today = Day(year: 2026, month: 10, day: 4)
        var series = DaySeries.empty
        series.merge([today.advanced(by: -2): 10, today.advanced(by: -1): 10, today: 3])
        let stats = MetricStats(series: series, scale: ThresholdScale([10, 20, 30, 40]), range: today.advanced(by: -2)...today, today: today)
        #expect(stats.currentStreak == 2)
    }
}

struct WeekGridLayoutTests {
    @Test func lastColumnHoldsToday() {
        let today = Day(year: 2026, month: 10, day: 7) // Wednesday
        let layout = WeekGridLayout(weeks: 4, end: today, firstWeekday: 2)
        #expect(layout.position(of: today)?.column == 3)
        #expect(layout.position(of: today)?.row == 2)
        #expect(layout.start == Day(year: 2026, month: 9, day: 14))
        #expect(layout.position(of: today.advanced(by: 1)) == nil)
    }

    @Test func monthLabelsLandOnTheWeekOfThe1st() {
        let layout = WeekGridLayout(weeks: 6, end: Day(year: 2026, month: 10, day: 7), firstWeekday: 2)
        let months = layout.monthStarts.map(\.month.month)
        #expect(months.contains(10))
    }
}

struct SleepAggregatorTests {
    let tz = TimeZone(identifier: "UTC")!

    func at(_ day: Int, _ hour: Int, _ minute: Int = 0) -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = tz
        return calendar.date(from: DateComponents(year: 2026, month: 5, day: day, hour: hour, minute: minute))!
    }

    @Test func overlappingSourcesAreNotDoubleCounted() {
        let watch = DateInterval(start: at(1, 23), end: at(2, 7))
        let phone = DateInterval(start: at(2, 0), end: at(2, 6))
        let result = SleepAggregator.minutesPerDay([watch, phone], timeZone: tz)
        #expect(result == [Day(year: 2026, month: 5, day: 2): 480])
    }

    @Test func nightIsCreditedToWakeDayEvenIfStagesEndBeforeMidnight() {
        let stages = [
            DateInterval(start: at(1, 22, 30), end: at(1, 23, 50)),
            DateInterval(start: at(1, 23, 55), end: at(2, 6, 30)),
        ]
        let result = SleepAggregator.minutesPerDay(stages, timeZone: tz)
        #expect(result.keys.count == 1)
        #expect(abs((result[Day(year: 2026, month: 5, day: 2)] ?? 0) - 475) < 0.001)
    }

    @Test func napIsItsOwnDay() {
        let nap = DateInterval(start: at(3, 14), end: at(3, 15))
        #expect(SleepAggregator.minutesPerDay([nap], timeZone: tz) == [Day(year: 2026, month: 5, day: 3): 60])
    }
}

struct ThresholdEditingTests {
    @Test func adjustingStaysBetweenNeighbours() {
        let bounds: [Double] = [700, 850, 1000, 1200]
        #expect(ThresholdScale.adjusting(bounds, index: 1, by: 50, step: 50) == [700, 900, 1000, 1200])
        #expect(ThresholdScale.adjusting(bounds, index: 1, by: 500, step: 50) == [700, 950, 1000, 1200])
        #expect(ThresholdScale.adjusting(bounds, index: 0, by: -5000, step: 50) == [50, 850, 1000, 1200])
        #expect(ThresholdScale.adjusting(bounds, index: 3, by: 300, step: 50) == [700, 850, 1000, 1500])
        #expect(ThresholdScale.adjusting(bounds, index: 9, by: 1, step: 1) == bounds)
    }
}

struct MonthLayoutTests {
    @Test func monthBlockColumns() {
        // October 2026 starts on Thursday; Monday-first puts it on row 3.
        let layout = MonthBlockLayout(month: Day(year: 2026, month: 10, day: 15), firstWeekday: 2)
        #expect(layout.leadingRows == 3)
        #expect(layout.columns == 5)
        let last = layout.position(of: Day(year: 2026, month: 10, day: 31))
        #expect(last?.column == 4 && last?.row == 5)
        #expect(layout.position(of: Day(year: 2026, month: 11, day: 1)) == nil)
    }

    @Test func monthsEndingAt() {
        let months = MonthBlockLayout.months(count: 3, endingAt: Day(year: 2026, month: 1, day: 20))
        #expect(months == [Day(year: 2025, month: 11, day: 1), Day(year: 2025, month: 12, day: 1), Day(year: 2026, month: 1, day: 1)])
    }

    @Test func calendarAlwaysSixWeeks() {
        let layout = MonthCalendarLayout(month: Day(year: 2026, month: 10, day: 1), firstWeekday: 2)
        #expect(layout.days.count == 42)
        #expect(layout.start == Day(year: 2026, month: 9, day: 28))
        #expect(layout.isInMonth(Day(year: 2026, month: 10, day: 31)) && !layout.isInMonth(layout.start))
    }
}

struct PaletteTests {
    /// The ranges are the product's differentiator: every tier must be
    /// visibly different from its neighbour in both appearances.
    @Test func levelsAreDistinctInBothAppearances() {
        func luminance(_ c: (r: Double, g: Double, b: Double)) -> Double { 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b }
        for palette in Palette.all {
            for dark in [true, false] {
                let hex = dark ? palette.dark : palette.light
                let levels = (0...4).map { Palette.components(hex: hex, level: $0, dark: dark) }
                for level in 1...4 {
                    let a = levels[level - 1], b = levels[level]
                    let distance = abs(a.r - b.r) + abs(a.g - b.g) + abs(a.b - b.b)
                    #expect(distance > 0.12, "\(palette.id) \(dark ? "dark" : "light") L\(level - 1)→L\(level)")
                }
                // Empty days must still read against the card in light mode.
                if !dark { #expect(luminance(levels[0]) < 0.97, "\(palette.id) light L0 floor") }
            }
        }
    }
}

struct TrialRecapTests {
    let end = Date(timeIntervalSince1970: 1_800_000_000)

    @Test func showsOnceAfterTheTrialEnds() {
        let defaults = UserDefaults(suiteName: "recap-test-\(UUID())")!
        #expect(!TrialRecap.shouldShow(trialEnd: end, access: .free, now: end.addingTimeInterval(-60), defaults: defaults))
        #expect(TrialRecap.shouldShow(trialEnd: end, access: .free, now: end.addingTimeInterval(60), defaults: defaults))
        #expect(!TrialRecap.shouldShow(trialEnd: end, access: .pro, now: end.addingTimeInterval(60), defaults: defaults))
        #expect(!TrialRecap.shouldShow(trialEnd: end, access: .free, now: end.addingTimeInterval(15 * 86_400), defaults: defaults))
        TrialRecap.markShown(defaults: defaults)
        #expect(!TrialRecap.shouldShow(trialEnd: end, access: .free, now: end.addingTimeInterval(60), defaults: defaults))
    }
}

struct WidgetScheduleTests {
    @Test func refreshesWhenTheTrialEnds() {
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        let ends = now.addingTimeInterval(600)
        #expect(WidgetSchedule.nextRefresh(now: now, access: .trial(endsAt: ends)) == ends)
        #expect(WidgetSchedule.nextRefresh(now: now, access: .pro) <= now.addingTimeInterval(3600))
    }
}

struct MonthBlocksGeometryTests {
    @Test func fitsWidthAndMapsTapsBack() {
        let blocks = MonthBlockLayout.months(count: 3, endingAt: Day(year: 2026, month: 10, day: 4)).map { MonthBlockLayout(month: $0, firstWeekday: 2) }
        let geometry = MonthBlocksGeometry(blocks: blocks, width: 330, showsWeekdays: true)
        let last = Day(year: 2026, month: 10, day: 4)
        let rect = geometry.rect(for: last)!
        #expect(rect.maxX <= 330.5)
        #expect(geometry.day(at: CGPoint(x: rect.midX, y: rect.midY)) == last)
        #expect(geometry.day(at: CGPoint(x: 1, y: 1)) == nil)
    }
}

struct DigitContrastTests {
    @Test func darkTextOnlyOnBrightFills() {
        let rose = Palette.with(id: "rose")
        #expect(!rose.prefersDarkText(level: 1, dark: true))
        #expect(rose.prefersDarkText(level: 4, dark: true))
        #expect(!Palette.with(id: "indigo").prefersDarkText(level: 4, dark: false))
    }
}
