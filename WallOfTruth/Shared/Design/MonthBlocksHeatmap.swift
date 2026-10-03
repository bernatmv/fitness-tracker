import SwiftUI

/// Geometry of one month drawn as weekday rows × week columns.
struct MonthBlockLayout: Equatable {
    let month: Day
    let firstWeekday: Int

    var first: Day { month.firstOfMonth }
    /// Row of the 1st (0 = first weekday).
    var leadingRows: Int { (first.weekday - firstWeekday + 7) % 7 }
    var columns: Int { (leadingRows + first.daysInMonth + 6) / 7 }

    func position(of day: Day) -> (column: Int, row: Int)? {
        let index = first.distance(to: day)
        guard index >= 0, index < first.daysInMonth else { return nil }
        return ((leadingRows + index) / 7, (leadingRows + index) % 7)
    }

    /// The `count` months ending with the month of `last`, oldest first.
    static func months(count: Int, endingAt last: Day) -> [Day] {
        (0..<count).map { last.firstOfMonth.adding(months: $0 - count + 1) }
    }
}

/// Where every month block sits for a given width. Blocks are separated by
/// one empty column, like Habit Heatmap.
struct MonthBlocksGeometry {
    let blocks: [MonthBlockLayout]
    let width: CGFloat
    let showsWeekdays: Bool
    var maxCell: CGFloat = 22

    static let labelHeight: CGFloat = 14
    static let labelGap: CGFloat = 8
    static let weekdayWidth: CGFloat = 16

    private var gapFraction: CGFloat { Theme.Grid.gapFraction }
    private var units: CGFloat { CGFloat(blocks.reduce(0) { $0 + $1.columns } + max(blocks.count - 1, 0)) }
    var gridLeft: CGFloat { showsWeekdays ? Self.weekdayWidth : 0 }

    var pitch: CGFloat {
        let available = max(width - gridLeft, 1)
        let fitted = available / (units - gapFraction / (1 + gapFraction))
        return min(fitted, maxCell * (1 + gapFraction))
    }

    var cell: CGFloat { pitch / (1 + gapFraction) }
    var gridTop: CGFloat { Self.labelHeight + Self.labelGap }
    var height: CGFloat { gridTop + 7 * pitch - cell * gapFraction }

    /// Left edge of each block.
    var origins: [CGFloat] {
        var x = gridLeft
        return blocks.map { block in
            defer { x += CGFloat(block.columns + 1) * pitch }
            return x
        }
    }

    func rect(for day: Day) -> CGRect? {
        for (block, x) in zip(blocks, origins) {
            if let p = block.position(of: day) {
                return CGRect(x: x + CGFloat(p.column) * pitch, y: gridTop + CGFloat(p.row) * pitch, width: cell, height: cell)
            }
        }
        return nil
    }

    func day(at point: CGPoint) -> Day? {
        let row = Int((point.y - gridTop) / pitch)
        guard point.y >= gridTop, (0..<7).contains(row) else { return nil }
        for (block, x) in zip(blocks, origins) {
            let column = Int((point.x - x) / pitch)
            guard point.x >= x, column < block.columns else { continue }
            let index = column * 7 + row - block.leadingRows
            return (0..<block.first.daysInMonth).contains(index) ? block.first.advanced(by: index) : nil
        }
        return nil
    }
}

/// Habit Heatmap's month view: the wall split into one block per month,
/// fitted to the available width, with month names above and weekday
/// initials on the left. One Canvas, so it renders in widgets too.
struct MonthBlocksHeatmap: View {
    let style: HeatmapStyle
    let months: [Day]
    var today: Day = .today
    var selected: Day?
    var showsWeekdays = true
    var maxCell: CGFloat = 22
    var firstWeekday: Int = Calendar.current.firstWeekday
    var onSelect: ((Day) -> Void)?

    private var blocks: [MonthBlockLayout] { months.map { MonthBlockLayout(month: $0, firstWeekday: firstWeekday) } }

    private func geometry(width: CGFloat) -> MonthBlocksGeometry {
        MonthBlocksGeometry(blocks: blocks, width: width, showsWeekdays: showsWeekdays, maxCell: maxCell)
    }

    var body: some View {
        HeightForWidth(height: { geometry(width: $0).height }) {
            Canvas { context, size in
                let geometry = geometry(width: size.width)
                drawLabels(&context, geometry)
                for block in geometry.blocks {
                    for index in 0..<block.first.daysInMonth {
                        let day = block.first.advanced(by: index)
                        guard let rect = geometry.rect(for: day) else { continue }
                        if day > today {
                            HeatmapCell.draw(in: &context, rect: rect, color: style.palette.color(level: 0).opacity(0.6), cornerFraction: 0.22)
                        } else {
                            HeatmapCell.draw(in: &context, rect: rect, color: style.color(day),
                                             outline: day == selected ? Theme.Colors.accent : (day == today ? Theme.Colors.todayOutline : nil),
                                             cornerFraction: 0.22)
                        }
                    }
                }
            }
        }
        .overlay {
            if let onSelect {
                GeometryReader { proxy in
                    Color.clear.contentShape(Rectangle()).onTapGesture { point in
                        if let day = geometry(width: proxy.size.width).day(at: point), day <= today { onSelect(day) }
                    }
                }
            }
        }
        .accessibilityElement()
        .accessibilityLabel(Text("a11y.wall"))
    }

    private func drawLabels(_ context: inout GraphicsContext, _ geometry: MonthBlocksGeometry) {
        for (block, x) in zip(geometry.blocks, geometry.origins) {
            let width = CGFloat(block.columns) * geometry.pitch - geometry.cell * Theme.Grid.gapFraction
            let current = block.first == today.firstOfMonth
            let label = Text(block.first.date(), format: .dateTime.month(.abbreviated))
                .font(.mono(11, weight: .medium))
                .foregroundStyle(current ? Theme.Colors.secondaryText : Theme.Colors.tertiaryText)
            context.draw(label, at: CGPoint(x: x + width / 2, y: MonthBlocksGeometry.labelHeight / 2), anchor: .center)
        }
        guard geometry.showsWeekdays else { return }
        for (row, symbol) in WeekdaySymbols.veryShort(firstWeekday: firstWeekday).enumerated() {
            let y = geometry.gridTop + CGFloat(row) * geometry.pitch + geometry.cell / 2
            context.draw(Text(symbol).font(.mono(min(10, geometry.cell * 0.75))).foregroundStyle(Theme.Colors.tertiaryText),
                         at: CGPoint(x: 0, y: y), anchor: .leading)
        }
    }
}

/// Lays out its content at the proposed width and a height derived from it.
struct HeightForWidth: Layout {
    let height: (CGFloat) -> CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 320
        return CGSize(width: width, height: height(width))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for subview in subviews {
            subview.place(at: bounds.origin, proposal: ProposedViewSize(bounds.size))
        }
    }
}

/// Weekday initials aligned to heatmap rows.
struct WeekdayColumn: View {
    let cell: CGFloat
    var firstWeekday: Int = Calendar.current.firstWeekday
    /// Show every row, or only alternating rows like HabitKit (Tue/Thu/Sat).
    var alternate = false

    var body: some View {
        VStack(alignment: .leading, spacing: cell * Theme.Grid.gapFraction) {
            ForEach(Array(WeekdaySymbols.short(firstWeekday: firstWeekday).enumerated()), id: \.offset) { index, symbol in
                Text(alternate && index % 2 == 0 ? "" : (alternate ? symbol : String(symbol.prefix(1))))
                    .font(.mono(min(11, cell * 0.85)))
                    .foregroundStyle(Theme.Colors.tertiaryText)
                    .frame(height: cell)
            }
        }
        .accessibilityHidden(true)
    }
}
