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
    let numDays: Int
    
    private let cellSize: CGFloat = 12
    private let cellGap: CGFloat = 5
    
    private var weeks: [[Date]] {
        calculateWeeks()
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: cellGap) {
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
        let startDate = calendar.date(byAdding: .day, value: -(numDays - 1), to: today) ?? today
        
        // Pad to start of week
        let weekday = calendar.component(.weekday, from: startDate)
        let daysFromMonday = (weekday + 5) % 7 // Convert to Monday = 0
        let paddedStart = calendar.date(byAdding: .day, value: -daysFromMonday, to: startDate) ?? startDate
        
        // Pad to end of week
        let endWeekday = calendar.component(.weekday, from: today)
        let daysToSunday = (7 - endWeekday) % 7
        let paddedEnd = calendar.date(byAdding: .day, value: daysToSunday, to: today) ?? today
        
        var weeks: [[Date]] = []
        var currentWeek: [Date] = []
        var currentDate = paddedStart
        
        while currentDate <= paddedEnd {
            currentWeek.append(currentDate)
            
            if currentWeek.count == 7 {
                weeks.append(currentWeek)
                currentWeek = []
            }
            
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        if !currentWeek.isEmpty {
            weeks.append(currentWeek)
        }
        
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
            // No data - use first color (level 0)
            return hexToColor(colors.first ?? "#eff2f5")
        }
        
        // Find color based on thresholds
        let colorIndex = getColorIndex(for: value, thresholds: thresholds)
        let colorHex = colors[min(colorIndex, colors.count - 1)]
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
        guard thresholds.count > 1 else { return 0 }
        
        for i in 0..<(thresholds.count - 1) {
            if value >= thresholds[i] && value < thresholds[i + 1] {
                return i
            }
        }
        
        // Value >= last threshold
        return thresholds.count - 1
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

