import SwiftUI

/// The person's own locked walls, fanned like a hand of cards. Real data
/// sells better than any illustration: "this is already yours, unlock it".
struct PaywallTeaser: View {
    let metrics: [Metric]
    @Environment(AppModel.self) private var model

    var body: some View {
        ZStack {
            ForEach(Array(metrics.prefix(Self.isCompact ? 1 : 3).enumerated().reversed()), id: \.element) { index, metric in
                card(metric, front: index == 0)
                    .scaleEffect(1 - CGFloat(index) * 0.07)
                    .offset(y: CGFloat(index) * -16)
                    .opacity(index == 0 ? 1 : 0.75 - Double(index) * 0.15)
            }
        }
        .padding(.top, CGFloat(max(min(metrics.count, Self.isCompact ? 1 : 3) - 1, 0)) * 16)
        .accessibilityHidden(true)
    }

    private func card(_ metric: Metric, front: Bool) -> some View {
        let settings = model.preferences[metric]
        let series = model.history(metric)
        let hasData = series.lastDayWithData != nil
        let style = HeatmapStyle(series: hasData ? series : Self.sample(metric), scale: settings.scale, palette: settings.palette)
        return VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            HStack(spacing: Theme.Spacing.m) {
                IconTile(metric: metric, palette: settings.palette, size: 36)
                    .opacity(front ? 1 : 0)
                VStack(alignment: .leading, spacing: 1) {
                    Text(metric.title).font(.scaled(15, weight: .semibold)).foregroundStyle(Theme.Colors.primaryText)
                    Text(hasData ? Plural.string("home.locked.days %lld", series.values.filter { $0 > 0 }.count) : String(localized: "pro.teaser.sample"))
                        .font(.scaled(12)).foregroundStyle(Theme.Colors.secondaryText)
                }
                .opacity(front ? 1 : 0)
                Spacer()
                Image(systemName: "lock.fill").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.Colors.secondaryText)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Theme.Colors.control))
                    .opacity(front ? 1 : 0)
            }
            // Same rule as the home cards: the shape shows, the details don't.
            // Short screens (SE) get a flatter wall so the plans stay above the CTA.
            WeekHeatmap(style: style, weeks: Self.isCompact ? 34 : 22, today: nil)
                .blur(radius: front ? 3 : 0)
        }
        .padding(Theme.Spacing.m + 2)
        .metricCard(settings.palette)
    }

    static var isCompact: Bool { UIScreen.main.bounds.height < 700 }

    /// Sample wall for people without data for that metric yet.
    static func sample(_ metric: Metric) -> DaySeries {
        let today = Day.today
        var series = DaySeries.empty
        series.merge(Dictionary(uniqueKeysWithValues: (0..<200).map { offset in
            let day = today.advanced(by: -offset)
            return (day, DemoHealthSource.value(metric, on: day))
        }))
        return series
    }
}
