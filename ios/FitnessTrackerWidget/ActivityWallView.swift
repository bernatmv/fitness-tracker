//
//  ActivityWallView.swift
//  FitnessTrackerWidget
//
//  SwiftUI implementation of the ActivityWall component
//

import SwiftUI

@available(iOS 14.0, *)
struct ActivityWallView: View {
    let dataPoints: [HealthDataPoint]
    let thresholds: [Double]
    let colors: [String]
    let availableWidth: CGFloat
    let minDays: Int
    
    private let cellSize: CGFloat = 11
    private let cellGap: CGFloat = 3
    
    // Calculate how many days can fit in the available width
    private var numDays: Int {
        let columnWidth = cellSize + cellGap
        // Calculate how many week columns can fit
        let maxColumns = max(1, Int(floor((availableWidth + cellGap) / columnWidth)))
        // Each column represents a week (7 days)
        // We want to show enough days to fill all available columns
        // Start from today and go back enough weeks to fill the width
        let calculatedDays = maxColumns * 7
        // Ensure we show at least the minimum days requested
        return max(calculatedDays, minDays)
    }
    
    private var weeks: [[Date]] {
        calculateWeeks()
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: cellGap) {
            Spacer(minLength: 0)
            ForEach(0..<weeks.count, id: \.self) { weekIndex in
                VStack(spacing: cellGap) {
                    ForEach(0..<7, id: \.self) { dayIndex in
                        if weekIndex < weeks.count && dayIndex < weeks[weekIndex].count {
                            let date = weeks[weekIndex][dayIndex]
                            ActivityCell(
                                date: date,
                                dataPoints: dataPoints,
                                thresholds: thresholds,
                                colors: colors,
                                displayStart: displayStart,
                                displayEnd: displayEnd,
                                size: cellSize
                            )
                        } else {
                            // Empty cell for alignment
                            Color.clear
                                .frame(width: cellSize, height: cellSize)
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
    }
    
    private var displayStart: Date {
        let today = Calendar.current.startOfDay(for: Date())
        return Calendar.current.date(byAdding: .day, value: -(numDays - 1), to: today) ?? today
    }
    
    private var displayEnd: Date {
        return Calendar.current.startOfDay(for: Date())
    }
    
    private func calculateWeeks() -> [[Date]] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // Calculate how many week columns we need to fill the width
        let columnWidth = cellSize + cellGap
        let maxColumns = max(1, Int(floor((availableWidth + cellGap) / columnWidth)))
        
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
}

struct ActivityCell: View {
    let date: Date
    let dataPoints: [HealthDataPoint]
    let thresholds: [Double]
    let colors: [String]
    let displayStart: Date
    let displayEnd: Date
    let size: CGFloat
    
    private var cellColor: Color {
        let calendar = Calendar.current
        let dateStart = calendar.startOfDay(for: date)
        let today = calendar.startOfDay(for: Date())
        
        // If date is in the future (beyond today), make it transparent
        guard dateStart <= today else {
            return Color.clear
        }
        
        // If date is before display range, make it transparent
        guard dateStart >= calendar.startOfDay(for: displayStart),
              dateStart <= calendar.startOfDay(for: displayEnd) else {
            return Color.clear
        }
        
        // Find data point for this date
        let dateKey = dateKeyString(from: dateStart)
        let dataPoint = dataPoints.first { point in
            guard let pointDate = point.dateValue else { return false }
            return dateKeyString(from: calendar.startOfDay(for: pointDate)) == dateKey
        }
        
        guard let value = dataPoint?.value else {
            // No data point for this date - use transparent/clear
            return Color.clear
        }
        
        // Find color based on thresholds
        // Match React Native logic: value >= thresholds[i] && value < thresholds[i+1] -> colors[i]
        // For value >= last threshold -> colors[colors.length - 1]
        guard !thresholds.isEmpty else {
            // No thresholds, use first color
            return hexToColor(colors.first ?? "#eff2f5")
        }
        
        let colorIndex = getColorIndex(for: value, thresholds: thresholds)
        let colorHex = colors[min(max(colorIndex, 0), colors.count - 1)]
        return hexToColor(colorHex)
    }
    
    var body: some View {
        RoundedRectangle(cornerRadius: 2)
            .fill(cellColor)
            .frame(width: size, height: size)
    }
    
    private func dateKeyString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    private func getColorIndex(for value: Double, thresholds: [Double]) -> Int {
        guard !thresholds.isEmpty else { return 0 }
        guard thresholds.count > 1 else {
            // Only one threshold - if value >= threshold, use last color, otherwise first
            return value >= thresholds[0] ? (colors.count - 1) : 0
        }
        
        // Match React Native GetColorForValue logic:
        // for (let i = 0; i < thresholds.length - 1; i++) {
        //   if (value >= thresholds[i] && value < thresholds[i + 1]) {
        //     return colors[i];
        //   }
        // }
        // return colors[colors.length - 1]; // for value >= last threshold
        
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

