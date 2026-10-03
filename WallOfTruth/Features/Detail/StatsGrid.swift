import SwiftUI

/// Two-column stat tiles for the last 365 days.
struct StatsGrid: View {
    let metric: Metric
    let stats: MetricStats
    let palette: Palette

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            Text("detail.stats.title").font(.sectionTitle).padding(.top, Theme.Spacing.s)
            LazyVGrid(columns: [GridItem(.flexible(), spacing: Theme.Spacing.m), GridItem(.flexible())], spacing: Theme.Spacing.m) {
                StatTile(value: "\(stats.currentStreak)", label: "detail.stats.current", symbol: "flame.fill", palette: palette)
                StatTile(value: "\(stats.bestStreak)", label: "detail.stats.best", symbol: "trophy.fill", palette: palette)
                StatTile(value: stats.goalRate.formatted(.percent.precision(.fractionLength(0))), label: "detail.stats.rate", symbol: "percent", palette: palette)
                StatTile(value: MetricFormat.compact(stats.average, for: metric), label: "detail.stats.average", symbol: "chart.bar.fill", palette: palette)
            }
            if let best = stats.best {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("detail.stats.bestday").font(.label).foregroundStyle(Theme.Colors.secondaryText)
                        Text(best.day.date(), format: .dateTime.day().month(.wide).year())
                            .font(.mono(13)).foregroundStyle(Theme.Colors.tertiaryText)
                    }
                    Spacer()
                    Text(MetricFormat.value(best.value, for: metric)).font(.system(size: 20, weight: .bold))
                }
                .padding(Theme.Spacing.l)
                .surface()
            }
        }
    }
}

private struct StatTile: View {
    let value: String
    let label: LocalizedStringKey
    let symbol: String
    let palette: Palette

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            HStack(alignment: .top) {
                Text(verbatim: value)
                    .font(.statNumber)
                    .foregroundStyle(Theme.Colors.primaryText)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                Spacer(minLength: Theme.Spacing.xs)
                Image(systemName: symbol)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(palette.color)
                    .frame(width: 32, height: 32)
                    .background(RoundedRectangle(cornerRadius: 9, style: .continuous).fill(palette.color.opacity(Theme.Grid.tileTint)))
            }
            Text(label).font(.label).foregroundStyle(Theme.Colors.secondaryText)
        }
        .padding(Theme.Spacing.l)
        .frame(maxWidth: .infinity, alignment: .leading)
        .surface()
        .accessibilityElement(children: .combine)
    }
}
