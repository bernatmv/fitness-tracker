import Foundation

/// A calendar day, independent of time zone and DST.
///
/// Stored as the number of days since 1970-01-01 of the *local* (Gregorian)
/// date, so arithmetic is plain integer math and two moments on the same
/// local day always map to the same `Day`. Conversions use pure integer
/// math (H. Hinnant's civil-days algorithms) because grids convert
/// thousands of days per render.
struct Day: Hashable, Comparable, Codable, Sendable, Strideable {
    let id: Int

    init(id: Int) { self.id = id }

    init(_ date: Date, timeZone: TimeZone = .current) {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        self.init(year: parts.year ?? 1970, month: parts.month ?? 1, day: parts.day ?? 1)
    }

    init(year: Int, month: Int, day: Int) {
        let y = month <= 2 ? year - 1 : year
        let era = (y >= 0 ? y : y - 399) / 400
        let yoe = y - era * 400
        let mp = (month + 9) % 12
        let doy = (153 * mp + 2) / 5 + day - 1
        let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
        id = era * 146_097 + doe - 719_468
    }

    static var today: Day { Day(Date()) }

    /// Local midnight of this day.
    func date(timeZone: TimeZone = .current) -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        return calendar.date(from: DateComponents(year: year, month: month, day: day)) ?? Date()
    }

    var year: Int { civil.year }
    var month: Int { civil.month }
    var day: Int { civil.day }

    /// 1 = Sunday … 7 = Saturday, matching `Calendar.firstWeekday`.
    var weekday: Int { ((id + 4) % 7 + 7) % 7 + 1 }

    var firstOfMonth: Day { advanced(by: 1 - day) }

    func adding(months: Int) -> Day {
        let total = year * 12 + (month - 1) + months
        let newYear = total >= 0 ? total / 12 : (total - 11) / 12
        return Day(year: newYear, month: total - newYear * 12 + 1, day: 1)
    }

    var daysInMonth: Int { adding(months: 1).id - firstOfMonth.id }

    /// Start of the week containing this day for a calendar's first weekday.
    func startOfWeek(firstWeekday: Int) -> Day {
        advanced(by: -((weekday - firstWeekday + 7) % 7))
    }

    static func < (lhs: Day, rhs: Day) -> Bool { lhs.id < rhs.id }
    func advanced(by n: Int) -> Day { Day(id: id + n) }
    func distance(to other: Day) -> Int { other.id - id }

    private var civil: (year: Int, month: Int, day: Int) {
        let z = id + 719_468
        let era = (z >= 0 ? z : z - 146_096) / 146_097
        let doe = z - era * 146_097
        let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365
        let doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
        let mp = (5 * doy + 2) / 153
        let d = doy - (153 * mp + 2) / 5 + 1
        let m = mp < 10 ? mp + 3 : mp - 9
        return (yoe + era * 400 + (m <= 2 ? 1 : 0), m, d)
    }
}
