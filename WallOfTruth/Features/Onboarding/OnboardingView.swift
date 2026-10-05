import SwiftUI

/// Two steps: what the app does, then Health access. Kept short so people
/// reach their own wall (the "aha" moment) before any paywall.
struct OnboardingView: View {
    @Environment(AppModel.self) private var model
    @State private var step = DebugFlags.screen == "onboarding-health" ? 1 : 0
    @State private var isConnecting = false

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                Group {
                    if step == 0 { welcome } else { health }
                }
                .padding(.horizontal, Theme.Spacing.xl)
                .readableWidth()
                .padding(.top, 56)
                .padding(.bottom, Theme.Spacing.xl)
                .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .opacity))
            }
            .scrollIndicators(.hidden)
            Button {
                if step == 0 { withAnimation(.smooth) { step = 1 } } else { Task { await connect() } }
            } label: {
                if isConnecting { ProgressView().tint(Theme.Colors.onAccent) } else { Text(step == 0 ? "common.continue" : "onboarding.connect") }
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(isConnecting)
            .padding(.horizontal, Theme.Spacing.xl)
            .readableWidth()
            .padding(.bottom, Theme.Spacing.l)
        }
        .screenBackground()
    }

    private var welcome: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
            (Text("onboarding.welcome.lead") + Text(verbatim: "\n") + Text("app.name").foregroundColor(Theme.Colors.accent))
                .font(.scaled(34, weight: .bold))
                .foregroundStyle(Theme.Colors.primaryText)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
            WelcomeWall()
            VStack(spacing: Theme.Spacing.m) {
                feature(.calories, "onboarding.feature.wall", "onboarding.feature.wall.detail", palette: "rose")
                feature(.exercise, "onboarding.feature.ranges", "onboarding.feature.ranges.detail", palette: "lime")
                feature(.sleep, "onboarding.feature.private", "onboarding.feature.private.detail", palette: "violet", symbol: "lock.fill")
            }
        }
    }

    private func feature(_ metric: Metric, _ title: LocalizedStringKey, _ detail: LocalizedStringKey, palette: String, symbol: String? = nil) -> some View {
        let palette = Palette.with(id: palette)
        return HStack(spacing: Theme.Spacing.m + 2) {
            RoundedRectangle(cornerRadius: 13, style: .continuous)
                .fill(palette.color.opacity(Theme.Grid.tileTint))
                .frame(width: 46, height: 46)
                .overlay {
                    Image(systemName: symbol ?? metric.symbol).font(.system(size: 19, weight: .semibold)).foregroundStyle(palette.color)
                }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.scaled(17, weight: .semibold)).foregroundStyle(Theme.Colors.primaryText)
                Text(detail).font(.scaled(15)).foregroundStyle(Theme.Colors.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(Theme.Spacing.l)
        .surface()
    }

    private var health: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Image(systemName: "heart.fill")
                .font(.scaled(40, weight: .semibold))
                .foregroundStyle(Palette.with(id: "rose").color)
                .frame(width: 96, height: 96)
                .background(Circle().fill(Palette.with(id: "rose").color.opacity(Theme.Grid.tileTint)))
                .padding(.top, Theme.Spacing.xxl)
            Text("onboarding.health.title")
                .font(.scaled(30, weight: .bold))
                .multilineTextAlignment(.center)
            Text("onboarding.health.detail")
                .font(.scaled(16))
                .foregroundStyle(Theme.Colors.secondaryText)
                .multilineTextAlignment(.center)
            VStack(spacing: 0) {
                ForEach(Metric.allCases) { metric in
                    HStack(spacing: Theme.Spacing.m) {
                        IconTile(metric: metric, palette: Palette.with(id: metric.defaultPaletteID), size: 30)
                        Text(metric.title).font(.label)
                        Spacer()
                        if metric.isFree {
                            Text("onboarding.free")
                                .font(.mono(10, weight: .bold)).tracking(1)
                                .foregroundStyle(Theme.Colors.onAccent)
                                .padding(.horizontal, 6).padding(.vertical, 2)
                                .background(Capsule().fill(Theme.Colors.positive))
                        } else {
                            ProBadge()
                        }
                    }
                    .padding(.vertical, Theme.Spacing.s + 1)
                }
            }
            .padding(.horizontal, Theme.Spacing.l)
            .padding(.vertical, Theme.Spacing.xs)
            .surface()
        }
    }

    private func connect() async {
        isConnecting = true
        await model.requestHealthAccess()
        isConnecting = false
        withAnimation(.smooth) { model.preferences.onboardingCompleted = true }
        model.startObservingHealth()
    }
}

/// Animated mini wall that fills in, previewing what the app makes.
private struct WelcomeWall: View {
    @State private var revealed = false

    var body: some View {
        let style = HeatmapStyle(series: PaywallTeaser.sample(.calories), scale: ThresholdScale(Metric.calories.defaultThresholds), palette: Palette.with(id: "rose"))
        WeekHeatmap(style: style, weeks: 24)
            .padding(Theme.Spacing.l)
            .metricCard(style.palette)
            .mask {
                GeometryReader { proxy in
                    Rectangle().frame(width: revealed ? proxy.size.width : 0)
                }
            }
            .onAppear { withAnimation(.easeOut(duration: 1.2).delay(0.2)) { revealed = true } }
            .accessibilityHidden(true)
    }
}
