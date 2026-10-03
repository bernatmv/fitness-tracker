import SwiftUI

/// One metric on the home screen: header, today's goal badge and its wall.
struct MetricCard: View {
    let metric: Metric
    let settings: MetricSettings
    let series: DaySeries
    let wallStyle: WallStyle
    let locked: Bool

    private var today: Day { .today }
    private var todayValue: Double { series[today] }
    private var style: HeatmapStyle { HeatmapStyle(series: series, scale: settings.scale, palette: settings.palette) }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m + 1) {
            header
            wall
                .modifier(LockedTeaser(locked: locked))
        }
        .padding(Theme.Spacing.l)
        .metricCard(settings.palette)
        .contentShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
        .accessibilityElement(children: .combine)
        .accessibilityLabel(Text(metric.title))
        .accessibilityValue(Text(locked ? String(localized: "pro.locked") : MetricFormat.value(todayValue, for: metric)))
    }

    private var header: some View {
        HStack(spacing: Theme.Spacing.m + 2) {
            IconTile(metric: metric, palette: settings.palette)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: Theme.Spacing.s) {
                    Text(metric.title).font(.cardTitle).foregroundStyle(Theme.Colors.primaryText)
                    if locked { ProBadge() }
                }
                Text(subtitle)
                    .font(.cardSubtitle)
                    .foregroundStyle(Theme.Colors.secondaryText)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            if !locked {
                GoalBadge(progress: settings.scale.goal > 0 ? todayValue / settings.scale.goal : 0, palette: settings.palette, symbol: metric.symbol)
                    .overlay(alignment: .topTrailing) {
                        if settings.scale.isExceptional(todayValue) { StarMark().offset(x: 5, y: -5) }
                    }
            }
        }
    }

    private var subtitle: String {
        if locked {
            let days = series.values.filter { $0 > 0 }.count
            return days > 0 ? Plural.string("home.locked.days %lld", days) : String(localized: "home.locked.empty")
        }
        return String(format: String(localized: "home.today %@ %@"),
                      MetricFormat.value(todayValue, for: metric),
                      MetricFormat.value(settings.scale.goal, for: metric))
    }

    @ViewBuilder private var wall: some View {
        switch wallStyle {
        case .weeks:
            WeekHeatmap(style: style, today: locked ? nil : today)
        case .month:
            MonthBlocksHeatmap(style: style, months: MonthBlockLayout.months(count: 3, endingAt: today), today: today)
        }
    }
}

/// Blurred, softened wall with an Unlock pill: the user's real data, just
/// out of reach.
struct LockedTeaser: ViewModifier {
    let locked: Bool

    func body(content: Content) -> some View {
        if locked {
            content
                .blur(radius: 3.5)
                .saturation(0.7)
                .opacity(0.8)
                .overlay { LockedPill() }
        } else {
            content
        }
    }
}
