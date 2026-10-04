import SwiftUI

/// Pure geometry for a weeks × weekdays grid: which day sits in which cell.
struct WeekGridLayout: Equatable {
    let weeks: Int
    let end: Day
    let firstWeekday: Int

    /// Top-left day: the first weekday, `weeks - 1` weeks before `end`'s week.
    var start: Day { end.startOfWeek(firstWeekday: firstWeekday).advanced(by: -7 * (weeks - 1)) }

    func day(column: Int, row: Int) -> Day { start.advanced(by: column * 7 + row) }

    func position(of day: Day) -> (column: Int, row: Int)? {
        let offset = start.distance(to: day)
        guard offset >= 0, day <= end else { return nil }
        return (offset / 7, offset % 7)
    }

    /// Columns whose week contains the 1st of a month, with that month.
    var monthStarts: [(column: Int, month: Day)] {
        (0..<weeks).compactMap { column in
            let first = day(column: column, row: 0)
            let last = first.advanced(by: 6)
            if first.day == 1 || last.day < first.day { return (column, last.firstOfMonth) }
            return nil
        }
    }

    static func cell(width: CGFloat, weeks: Int) -> CGFloat {
        width / (CGFloat(weeks) + CGFloat(weeks - 1) * Theme.Grid.gapFraction)
    }

    static func aspectRatio(weeks: Int) -> CGFloat {
        (CGFloat(weeks) + CGFloat(weeks - 1) * Theme.Grid.gapFraction) / (7 + 6 * Theme.Grid.gapFraction)
    }
}

/// Everything a heatmap needs to color a day.
struct HeatmapStyle {
    let series: DaySeries
    let scale: ThresholdScale
    let palette: Palette
    /// Tinted/clear widgets keep only opacity, so tiers become opacity steps.
    var monochrome = false

    static let monochromeOpacity: [Double] = [0.14, 0.34, 0.55, 0.78, 1.0]

    func color(_ day: Day) -> Color { color(level: scale.level(for: series[day])) }

    func color(level: Int) -> Color {
        monochrome ? Color.primary.opacity(Self.monochromeOpacity[min(max(level, 0), 4)]) : palette.color(level: level)
    }
}

/// HabitKit-style wall: one column per week, one row per weekday, drawn in a
/// single Canvas so hundreds of cells stay cheap to render.
struct WeekHeatmap: View {
    let style: HeatmapStyle
    var weeks: Int = Theme.Grid.cardWeeks
    var end: Day = .today
    var today: Day? = .today
    var selected: Day?
    var fadeLeading = true
    var firstWeekday: Int = Calendar.current.firstWeekday
    var onSelect: ((Day) -> Void)?

    private var layout: WeekGridLayout { WeekGridLayout(weeks: weeks, end: end, firstWeekday: firstWeekday) }

    var body: some View {
        Canvas { context, size in
            let cell = WeekGridLayout.cell(width: size.width, weeks: weeks)
            let pitch = cell * (1 + Theme.Grid.gapFraction)
            let layout = layout
            for column in 0..<weeks {
                for row in 0..<7 {
                    let day = layout.day(column: column, row: row)
                    guard day <= end else { continue }
                    let rect = CGRect(x: CGFloat(column) * pitch, y: CGFloat(row) * pitch, width: cell, height: cell)
                    HeatmapCell.draw(in: &context, rect: rect, color: style.color(day),
                                     outline: day == selected ? Theme.Colors.accent : (day == today ? Theme.Colors.todayOutline : nil))
                }
            }
        }
        .aspectRatio(WeekGridLayout.aspectRatio(weeks: weeks), contentMode: .fit)
        .mask {
            if fadeLeading {
                LinearGradient(stops: [.init(color: .black.opacity(0.05), location: 0), .init(color: .black, location: 0.14)],
                               startPoint: .leading, endPoint: .trailing)
            } else {
                Rectangle()
            }
        }
        .overlay {
            if let onSelect {
                GeometryReader { proxy in
                    Color.clear.contentShape(Rectangle()).onTapGesture { point in
                        let pitch = WeekGridLayout.cell(width: proxy.size.width, weeks: weeks) * (1 + Theme.Grid.gapFraction)
                        let column = Int(point.x / pitch), row = Int(point.y / pitch)
                        guard (0..<weeks).contains(column), (0..<7).contains(row) else { return }
                        let day = layout.day(column: column, row: row)
                        if day <= end { onSelect(day) }
                    }
                }
            }
        }
        .accessibilityElement()
        .accessibilityLabel(Text("a11y.wall"))
    }
}

/// One rounded heatmap square, shared by every grid.
enum HeatmapCell {
    /// An outlined cell (today, selection) draws its ring on the cell edge
    /// and shrinks the fill inside it, so nothing spills past the grid.
    static func draw(in context: inout GraphicsContext, rect: CGRect, color: Color, outline: Color? = nil, cornerFraction: CGFloat = Theme.Radius.cellFraction) {
        let radius = rect.width * cornerFraction
        guard let outline else {
            context.fill(Path(roundedRect: rect, cornerRadius: radius, style: .continuous), with: .color(color))
            return
        }
        let line = max(1.2, rect.width * 0.13)
        let ring = rect.insetBy(dx: line / 2, dy: line / 2)
        context.stroke(Path(roundedRect: ring, cornerRadius: radius, style: .continuous), with: .color(outline), lineWidth: line)
        let inner = rect.insetBy(dx: line * 1.8, dy: line * 1.8)
        context.fill(Path(roundedRect: inner, cornerRadius: max(radius - line * 1.8, 1), style: .continuous), with: .color(color))
    }
}

/// Short weekday labels in the user's week order, e.g. ["M", "T", …].
enum WeekdaySymbols {
    static func veryShort(firstWeekday: Int = Calendar.current.firstWeekday, calendar: Calendar = .current) -> [String] {
        rotate(calendar.veryShortStandaloneWeekdaySymbols, firstWeekday)
    }

    static func short(firstWeekday: Int = Calendar.current.firstWeekday, calendar: Calendar = .current) -> [String] {
        rotate(calendar.shortStandaloneWeekdaySymbols, firstWeekday)
    }

    private static func rotate(_ symbols: [String], _ first: Int) -> [String] {
        Array(symbols[(first - 1)...] + symbols[..<(first - 1)])
    }
}
