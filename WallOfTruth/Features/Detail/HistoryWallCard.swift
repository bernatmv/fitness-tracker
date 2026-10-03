import SwiftUI

/// The full history wall, scrollable back in time, with month and weekday
/// labels (HabitKit detail card). Drawn as half-year chunks in a lazy stack
/// so years of history never become one giant texture.
struct HistoryWallCard: View {
    let metric: Metric
    let style: HeatmapStyle
    @Binding var selected: Day?

    private let cell: CGFloat = 11
    private let chunkWeeks = 26
    private var pitch: CGFloat { cell * (1 + Theme.Grid.gapFraction) }

    /// At least a year; more when older data exists (about ten years max).
    private var chunks: Int {
        guard let first = style.series.firstDayWithData else { return 2 }
        let weeks = min(max(first.distance(to: .today) / 7 + 2, 53), 520)
        return (weeks + chunkWeeks - 1) / chunkWeeks
    }

    /// Last day drawn by chunk `index` (0 = newest, ending today).
    private func end(of index: Int) -> Day {
        guard index > 0 else { return .today }
        return Day.today.startOfWeek(firstWeekday: Calendar.current.firstWeekday).advanced(by: -7 * chunkWeeks * index + 6)
    }

    var body: some View {
        HStack(alignment: .bottom, spacing: Theme.Spacing.s) {
            WeekdayColumn(cell: cell, alternate: true)
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(alignment: .bottom, spacing: cell * Theme.Grid.gapFraction) {
                    ForEach((0..<chunks).reversed(), id: \.self) { index in
                        chunk(end: end(of: index))
                    }
                }
            }
            .defaultScrollAnchor(.trailing)
            .mask {
                LinearGradient(stops: [.init(color: .black.opacity(0.1), location: 0), .init(color: .black, location: 0.06)],
                               startPoint: .leading, endPoint: .trailing)
            }
        }
        .padding(Theme.Spacing.l)
        .metricCard(style.palette)
    }

    private func chunk(end: Day) -> some View {
        let layout = WeekGridLayout(weeks: chunkWeeks, end: end, firstWeekday: Calendar.current.firstWeekday)
        let width = CGFloat(chunkWeeks) * pitch - cell * Theme.Grid.gapFraction
        return VStack(alignment: .leading, spacing: Theme.Spacing.s) {
            ZStack(alignment: .topLeading) {
                ForEach(layout.monthStarts, id: \.column) { start in
                    Text(start.month.date(), format: start.month.month == 1 ? .dateTime.month(.abbreviated).year(.twoDigits) : .dateTime.month(.abbreviated))
                        .font(.mono(10))
                        .foregroundStyle(Theme.Colors.tertiaryText)
                        .fixedSize()
                        .offset(x: CGFloat(start.column) * pitch)
                }
            }
            .frame(width: width, height: 12, alignment: .topLeading)
            .clipped()
            WeekHeatmap(style: style, weeks: chunkWeeks, end: end, selected: selected, fadeLeading: false) { day in
                selected = selected == day ? nil : day
            }
            .frame(width: width)
        }
    }
}
