import SwiftUI

/// Always six rows of seven days, padded with neighbouring months.
struct MonthCalendarLayout: Equatable {
    let month: Day
    let firstWeekday: Int

    var start: Day { month.firstOfMonth.startOfWeek(firstWeekday: firstWeekday) }
    var days: [Day] { (0..<42).map { start.advanced(by: $0) } }
    func isInMonth(_ day: Day) -> Bool { day.firstOfMonth == month.firstOfMonth }
}

/// HabitKit-style month calendar, colored by range instead of done/not done.
struct MonthCalendarCard: View {
    let metric: Metric
    let style: HeatmapStyle
    @Binding var selected: Day?
    @State private var month = Day.today.firstOfMonth

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 5), count: 7)

    var body: some View {
        let layout = MonthCalendarLayout(month: month, firstWeekday: Calendar.current.firstWeekday)
        VStack(spacing: Theme.Spacing.m) {
            LazyVGrid(columns: columns, spacing: 5) {
                ForEach(WeekdaySymbols.short(), id: \.self) { symbol in
                    Text(symbol).font(.mono(12)).foregroundStyle(Theme.Colors.secondaryText).frame(height: 22)
                }
                ForEach(layout.days, id: \.self) { day in
                    DayCell(day: day, style: style, inMonth: layout.isInMonth(day), selected: day == selected) {
                        selected = selected == day ? nil : day
                    }
                }
            }
            footer
        }
        .padding(Theme.Spacing.l)
        .surface(radius: Theme.Radius.card)
        .gesture(DragGesture(minimumDistance: 30).onEnded { value in
            if value.translation.width < -40 { step(1) } else if value.translation.width > 40 { step(-1) }
        })
    }

    private var footer: some View {
        HStack(spacing: Theme.Spacing.s) {
            Button { month = Day.today.firstOfMonth } label: {
                Label {
                    Text(month.date(), format: .dateTime.month(.abbreviated).year())
                } icon: {
                    Image(systemName: "calendar")
                }
                .font(.mono(14, weight: .medium))
                .foregroundStyle(Theme.Colors.primaryText)
                .padding(.horizontal, Theme.Spacing.m)
                .frame(height: 36)
                .overlay(Capsule().strokeBorder(Theme.Colors.cardBorder, lineWidth: 1))
            }
            .buttonStyle(.plain)
            Spacer()
            arrow("chevron.left", label: "detail.month.previous", enabled: true) { step(-1) }
            arrow("chevron.right", label: "detail.month.next", enabled: month < Day.today.firstOfMonth) { step(1) }
        }
    }

    private func arrow(_ symbol: String, label: LocalizedStringKey, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .semibold))
                .frame(width: 36, height: 36)
                .overlay(Circle().strokeBorder(Theme.Colors.cardBorder, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .foregroundStyle(enabled ? Theme.Colors.primaryText : Theme.Colors.tertiaryText)
        .disabled(!enabled)
        .accessibilityLabel(Text(label))
    }

    private func step(_ months: Int) {
        let target = month.adding(months: months)
        guard target <= Day.today.firstOfMonth else { return }
        withAnimation(.snappy) { month = target }
    }
}

private struct DayCell: View {
    let day: Day
    let style: HeatmapStyle
    let inMonth: Bool
    let selected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        let today = Day.today
        let value = style.series[day]
        let level = style.scale.level(for: value)
        let future = day > today
        Button(action: action) {
            Text(verbatim: "\(day.day)")
                .font(.mono(14, weight: day == today ? .bold : .regular))
                .foregroundStyle(textColor(level: level, future: future).opacity(inMonth ? 1 : 0.45))
                .frame(maxWidth: .infinity)
                .frame(height: 40)
                .background {
                    RoundedRectangle(cornerRadius: Theme.Radius.dayCell, style: .continuous)
                        .fill(level > 0 && !future ? style.palette.color(level: level) : .clear)
                }
                .overlay {
                    if selected || day == today {
                        RoundedRectangle(cornerRadius: Theme.Radius.dayCell, style: .continuous)
                            .strokeBorder(selected ? Theme.Colors.accent : Theme.Colors.todayOutline, lineWidth: 1.5)
                    }
                }
                .overlay(alignment: .topTrailing) {
                    if !future, style.scale.isExceptional(value) {
                        Image(systemName: "star.fill").font(.system(size: 7, weight: .bold))
                            .foregroundStyle(Theme.Colors.star).padding(4)
                    }
                }
                .opacity(inMonth ? 1 : 0.7)
        }
        .buttonStyle(.plain)
        .disabled(future)
        .accessibilityLabel(Text(day.date(), format: .dateTime.day().month(.wide)))
        .accessibilityValue(Text(future ? "" : RangeName.text(level)))
    }

    private func textColor(level: Int, future: Bool) -> Color {
        if future { return Theme.Colors.tertiaryText.opacity(0.6) }
        guard level > 0 else { return Theme.Colors.tertiaryText }
        // Pick by the fill's brightness so digits stay legible on every tier.
        return style.palette.prefersDarkText(level: level, dark: colorScheme == .dark)
            ? Theme.Colors.inkDark : Theme.Colors.inkLight
    }
}
