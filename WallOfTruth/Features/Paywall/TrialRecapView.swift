import SwiftUI

/// When to show the end-of-trial recap: once, on the first open after the
/// trial ended without a purchase, while it is still fresh.
enum TrialRecap {
    private static let key = "trial_recap_shown"
    static let freshFor: TimeInterval = 14 * 86_400

    static func shouldShow(trialEnd: Date?, access: Access, now: Date = Date(), defaults: UserDefaults = .standard) -> Bool {
        guard let trialEnd, access == .free, now >= trialEnd, now < trialEnd.addingTimeInterval(freshFor) else { return false }
        return !defaults.bool(forKey: key)
    }

    static func markShown(defaults: UserDefaults = .standard) { defaults.set(true, forKey: key) }
}

/// "Your Pro week": what the trial showed them, metric by metric, and what
/// they keep by unlocking. The highest-intent moment for a one-time unlock.
struct TrialRecapView: View {
    let upgrade: () -> Void
    @Environment(AppModel.self) private var model
    @Environment(PurchaseManager.self) private var purchases
    @Environment(\.dismiss) private var dismiss

    private var metrics: [Metric] {
        model.visibleMetrics.filter { !$0.isFree && model.history($0).lastDayWithData != nil }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                    Text("recap.title").font(.system(size: 32, weight: .bold))
                    Text("recap.subtitle").font(.system(size: 16)).foregroundStyle(Theme.Colors.secondaryText)
                }
                VStack(spacing: Theme.Spacing.m) {
                    ForEach(metrics) { metric in row(metric) }
                }
            }
            .padding(.horizontal, Theme.Spacing.xl)
            .padding(.top, Theme.Spacing.xxl + Theme.Spacing.l)
        }
        .scrollIndicators(.hidden)
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: Theme.Spacing.m) {
                Button(action: upgrade) {
                    Text(String(format: String(localized: "recap.cta %@"), purchases.proPrice ?? ""))
                }
                .buttonStyle(PrimaryButtonStyle())
                Button("recap.later") { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Theme.Colors.secondaryText)
            }
            .padding(.horizontal, Theme.Spacing.xl)
            .padding(.vertical, Theme.Spacing.m)
            .background(Theme.Colors.background.ignoresSafeArea())
        }
        .screenBackground()
    }

    private func row(_ metric: Metric) -> some View {
        let settings = model.preferences[metric]
        let series = model.history(metric)
        let end = min(purchases.trialEnd.map { Day($0) } ?? .today, .today)
        let days = (0..<7).map { end.advanced(by: $0 - 6) }
        let hits = days.filter { settings.scale.meetsGoal(series[$0]) }.count
        return HStack(spacing: Theme.Spacing.m) {
            IconTile(metric: metric, palette: settings.palette, size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(metric.title).font(.system(size: 16, weight: .semibold))
                Text(String(format: String(localized: "recap.goal %lld %lld"), hits, days.count))
                    .font(.system(size: 13)).foregroundStyle(Theme.Colors.secondaryText)
            }
            Spacer(minLength: Theme.Spacing.s)
            HStack(spacing: 3) {
                ForEach(days, id: \.self) { day in
                    RoundedRectangle(cornerRadius: 3, style: .continuous)
                        .fill(settings.palette.color(level: settings.scale.level(for: series[day])))
                        .frame(width: 13, height: 13)
                }
            }
            .accessibilityHidden(true)
        }
        .padding(Theme.Spacing.m + 2)
        .metricCard(settings.palette)
    }
}
