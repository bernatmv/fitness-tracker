import SwiftUI

/// The person's own locked walls, fanned like a hand of cards. Real data
/// sells better than any illustration: "this is already yours, unlock it".
struct PaywallTeaser: View {
    let metrics: [Metric]
    @Environment(AppModel.self) private var model

    var body: some View {
        ZStack {
            ForEach(Array(metrics.enumerated().reversed()), id: \.element) { index, metric in
                card(metric, front: index == 0)
                    .scaleEffect(1 - CGFloat(index) * 0.07)
                    .offset(y: CGFloat(index) * -16)
                    .opacity(index == 0 ? 1 : 0.75 - Double(index) * 0.15)
            }
        }
        .padding(.top, CGFloat(max(metrics.count - 1, 0)) * 16)
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
                    Text(metric.title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.Colors.primaryText)
                    Text(hasData ? Plural.string("home.locked.days %lld", series.values.filter { $0 > 0 }.count) : String(localized: "pro.teaser.sample"))
                        .font(.system(size: 12)).foregroundStyle(Theme.Colors.secondaryText)
                }
                .opacity(front ? 1 : 0)
                Spacer()
                Image(systemName: "lock.fill").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.Colors.secondaryText)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Theme.Colors.control))
                    .opacity(front ? 1 : 0)
            }
            // Same rule as the home cards: the shape shows, the details don't.
            WeekHeatmap(style: style, weeks: 22, today: nil)
                .blur(radius: front ? 3 : 0)
        }
        .padding(Theme.Spacing.m + 2)
        .metricCard(settings.palette)
    }

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

/// Home banner during and after the trial — the highest-intent moment.
struct TrialBanner: View {
    let upgrade: () -> Void
    @Environment(PurchaseManager.self) private var purchases

    var body: some View {
        if case .trial(let endsAt) = purchases.access, endsAt > Date() {
            banner(symbol: "hourglass", title: Text(Plural.string("trial.active %lld", daysLeft(endsAt))),
                   detail: "trial.active.detail")
        } else if purchases.access.showsUpsell, let end = purchases.trialEnd, end <= Date(),
                  Date().timeIntervalSince(end) < TrialRecap.freshFor {
            banner(symbol: "lock.open.fill", title: Text("trial.ended"), detail: "trial.ended.detail")
        }
    }

    private func daysLeft(_ end: Date) -> Int {
        max(1, Int((end.timeIntervalSinceNow / 86_400).rounded(.up)))
    }

    private func banner(symbol: String, title: Text, detail: LocalizedStringKey) -> some View {
        Button(action: upgrade) {
            HStack(spacing: Theme.Spacing.m) {
                Image(systemName: symbol)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Theme.Colors.accent)
                    .frame(width: 40, height: 40)
                    .background(RoundedRectangle(cornerRadius: Theme.Radius.tile, style: .continuous).fill(Theme.Colors.accentSoft))
                VStack(alignment: .leading, spacing: 2) {
                    title.font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.Colors.primaryText)
                    Text(detail).font(.system(size: 13)).foregroundStyle(Theme.Colors.secondaryText)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.Colors.tertiaryText)
            }
            .padding(Theme.Spacing.m + 2)
            .surface(radius: Theme.Radius.card)
        }
        .buttonStyle(CardButtonStyle())
    }
}
