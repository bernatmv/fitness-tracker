//
//  ActivityWallView.swift
//  FitnessTrackerWidget
//
//  SwiftUI implementation of the ActivityWall component.
//
//  IMPORTANT: the wall is drawn in a single Canvas instead of one SwiftUI
//  view per cell. Widgets have strict view-archival limits — a ~180-cell
//  grid of individual shape views can make WidgetKit silently discard the
//  rendered timeline (the widget then sticks on its redacted placeholder,
//  with no crash and no memory kill).
//

import SwiftUI

@available(iOS 15.0, *)
struct ActivityWallView: View {
    let dataPoints: [HealthDataPoint]
    let thresholds: [Double]
    let colors: [String]
    let availableWidth: CGFloat
    let minDays: Int

    private let cellSize: CGFloat = 11
    private let cellGap: CGFloat = 3

    // Calculate how many days can fit in the available width
    // This maximizes the number of days shown based on available space
    private var numDays: Int {
        guard availableWidth > 0 else {
            return minDays
        }

        let columnWidth = cellSize + cellGap
        // Calculate how many week columns can fit in the available width
        // Formula: (availableWidth + cellGap) / (cellSize + cellGap)
        // The +cellGap in numerator accounts for the gap after the last column
        let maxColumns = max(1, Int(floor((availableWidth + cellGap) / columnWidth)))
        // Each column represents a week (7 days)
        let calculatedDays = maxColumns * 7
        // Ensure we show at least the minimum days requested, but maximize to fill width
        return max(calculatedDays, minDays)
    }

    var body: some View {
        let weeks = calculateWeeks()
        let valuesByDay = buildDataPointValuesByDay()
        let displayStart = Calendar.current.date(
            byAdding: .day,
            value: -(numDays - 1),
            to: Calendar.current.startOfDay(for: Date())
        ) ?? Date()
        let displayEnd = Calendar.current.startOfDay(for: Date())

        Canvas { context, size in
            let columnWidth = cellSize + cellGap
            let gridWidth = CGFloat(weeks.count) * columnWidth - cellGap
            // Right-align the grid (GitHub-style, most recent week at the edge)
            let originX = max(0, size.width - gridWidth)

            for (weekIndex, week) in weeks.enumerated() {
                for (dayIndex, date) in week.enumerated() where dayIndex < 7 {
                    guard let color = cellColor(
                        for: date,
                        valuesByDay: valuesByDay,
                        displayStart: displayStart,
                        displayEnd: displayEnd
                    ) else {
                        continue // future / out-of-range days stay transparent
                    }

                    let rect = CGRect(
                        x: originX + CGFloat(weekIndex) * columnWidth,
                        y: CGFloat(dayIndex) * columnWidth,
                        width: cellSize,
                        height: cellSize
                    )
                    context.fill(
                        Path(roundedRect: rect, cornerRadius: 2),
                        with: .color(color)
                    )
                }
            }
        }
    }

    /// Color for a day cell, or nil when the cell should be transparent
    private func cellColor(
        for date: Date,
        valuesByDay: [String: Double],
        displayStart: Date,
        displayEnd: Date
    ) -> Color? {
        let calendar = Calendar.current
        let dateStart = calendar.startOfDay(for: date)
        let today = calendar.startOfDay(for: Date())

        // Future dates and dates outside the display range are transparent
        guard dateStart <= today,
              dateStart >= calendar.startOfDay(for: displayStart),
              dateStart <= calendar.startOfDay(for: displayEnd) else {
            return nil
        }

        // Fast lookup: avoid scanning the entire dataPoints array per cell
        let dateKey = ActivityWallView.DayKeyString(from: dateStart)
        guard let value = valuesByDay[dateKey] else {
            return nil // no data point for this date
        }

        guard !thresholds.isEmpty else {
            return hexToColor(colors.first ?? "#eff2f5")
        }

        // Match React Native logic: value >= thresholds[i] && value < thresholds[i+1] -> colors[i]
        // For value >= last threshold -> colors[colors.length - 1]
        let colorIndex = getColorIndex(for: value)
        let maxIndex = max(colors.count - 1, 0)
        let safeIndex = min(max(colorIndex, 0), maxIndex)
        let colorHex = colors.indices.contains(safeIndex)
            ? colors[safeIndex]
            : (colors.first ?? "#eff2f5")
        return hexToColor(colorHex)
    }

    private func calculateWeeks() -> [[Date]] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())

        let totalWeeks = Int(ceil(Double(numDays) / 7.0))
        let maxColumns = max(1, totalWeeks)

        // Find Monday of the week containing today
        let todayWeekday = calendar.component(.weekday, from: today)
        let daysFromMonday = (todayWeekday + 5) % 7 // Monday = 0, Sunday = 6
        let thisWeekMonday = calendar.date(byAdding: .day, value: -daysFromMonday, to: today) ?? today

        // Calculate how many complete weeks we need before today's week
        let weeksBefore = max(0, maxColumns - 1) // -1 because today's week is one column

        // Start from Monday of the first week we need to show
        let firstMonday = calendar.date(byAdding: .day, value: -(weeksBefore * 7), to: thisWeekMonday) ?? thisWeekMonday

        var weeks: [[Date]] = []
        var currentDate = firstMonday

        // Build complete weeks before today's week
        for _ in 0..<weeksBefore {
            var week: [Date] = []
            for i in 0..<7 {
                if let date = calendar.date(byAdding: .day, value: i, to: currentDate) {
                    week.append(date)
                }
            }
            weeks.append(week)
            currentDate = calendar.date(byAdding: .day, value: 7, to: currentDate) ?? currentDate
        }

        // Build the last week (today's week) - from Monday to today, then pad with future dates
        var lastWeek: [Date] = []
        var weekDate = thisWeekMonday
        while weekDate <= today {
            lastWeek.append(weekDate)
            weekDate = calendar.date(byAdding: .day, value: 1, to: weekDate) ?? weekDate
        }

        // Pad the last week to 7 days with future dates (transparent)
        while lastWeek.count < 7 {
            let futureDate = calendar.date(byAdding: .day, value: lastWeek.count, to: thisWeekMonday) ?? today
            lastWeek.append(futureDate)
        }
        weeks.append(lastWeek)

        return weeks
    }

    private func buildDataPointValuesByDay() -> [String: Double] {
        let calendar = Calendar.current
        var map: [String: Double] = [:]
        for point in dataPoints {
            guard let pointDate = point.dateValue else { continue }
            let day = calendar.startOfDay(for: pointDate)
            let key = ActivityWallView.DayKeyString(from: day)
            // Keep the first value for a given day (dataPoints should already be unique per day).
            if map[key] == nil {
                map[key] = point.value
            }
        }
        return map
    }

    private static let dayKeyFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    static func DayKeyString(from date: Date) -> String {
        // This is used as a stable day key, not as a user-facing date format.
        return dayKeyFormatter.string(from: date)
    }

    private func getColorIndex(for value: Double) -> Int {
        guard !thresholds.isEmpty else { return 0 }
        guard thresholds.count > 1 else {
            // Only one threshold - if value >= threshold, use last color, otherwise first
            return value >= thresholds[0] ? (colors.count - 1) : 0
        }

        for i in 0..<(thresholds.count - 1) {
            if value >= thresholds[i] && value < thresholds[i + 1] {
                return i
            }
        }

        // Value >= last threshold - use last color
        return colors.count - 1
    }

    private func hexToColor(_ hex: String) -> Color {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexSanitized.hasPrefix("#") {
            hexSanitized.removeFirst()
        }

        var int: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hexSanitized.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        return Color(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
