import StoreKit
import SwiftUI

/// Why the paywall opened; drives its hero and analytics-free copy.
struct PaywallRequest: Identifiable {
    let id = UUID()
    var highlight: Metric?
}

struct HomeView: View {
    @Environment(AppModel.self) private var model
    @Environment(PurchaseManager.self) private var purchases
    @Environment(\.requestReview) private var requestReview
    @State private var path: [Metric] = []
    @State private var paywall: PaywallRequest?
    @State private var showsSettings = false
    @State private var showsRecap = false

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                LazyVStack(spacing: Theme.Spacing.l - 1) {
                    TrialBanner { paywall = PaywallRequest() }
                    let status = HomeStatus.resolve(hasData: model.hasAnyData, isSyncing: model.isSyncing, hasSynced: model.syncState.lastSync != nil)
                    if let status {
                        HomeStatusCard(status: status) { Task { await model.resyncAll() } }
                            .transition(.opacity)
                    }
                    // Empty walls under the status card would only repeat it.
                    ForEach(status == nil ? model.visibleMetrics : []) { metric in
                        let locked = !model.access.canView(metric)
                        Button {
                            if locked { paywall = PaywallRequest(highlight: metric) } else { path.append(metric) }
                        } label: {
                            MetricCard(metric: metric, settings: model.preferences[metric], series: model.history(metric),
                                       wallStyle: model.preferences.wallStyle, locked: locked)
                        }
                        .buttonStyle(CardButtonStyle())
                    }
                    if model.visibleMetrics.isEmpty { EmptyMetricsView { showsSettings = true } }
                }
                .padding(.horizontal, Theme.Spacing.screen)
                .padding(.top, Theme.Spacing.s)
                .padding(.bottom, 120)
                .animation(.smooth, value: model.preferences.wallStyle)
                .animation(.smooth, value: model.hasAnyData)
            }
            .scrollIndicators(.hidden)
            .refreshable { await model.refresh() }
            .screenBackground()
            .safeAreaInset(edge: .top) { topBar }
            .overlay(alignment: .bottom) {
                WallStyleSwitcher(selection: Binding(get: { model.preferences.wallStyle }, set: { model.preferences.wallStyle = $0 }))
                    .padding(.bottom, Theme.Spacing.s)
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: Metric.self) { MetricDetailView(metric: $0) }
        }
        .sheet(item: $paywall) { PaywallView(highlight: $0.highlight) }
        .sheet(isPresented: $showsSettings) { SettingsView() }
        .sheet(isPresented: $showsRecap) {
            TrialRecapView { showsRecap = false; paywall = PaywallRequest() }
                .presentationDetents([.large])
        }
        .task { await firstAppearance() }
        .onOpenURL { url in
            switch DeepLink.parse(url) {
            case .paywall: paywall = PaywallRequest()
            case .metric(let metric) where model.access.canView(metric): path = [metric]
            case .metric(let metric): paywall = PaywallRequest(highlight: metric)
            case nil: break
            }
        }
    }

    private var topBar: some View {
        HStack(spacing: Theme.Spacing.s) {
            CircleButton(symbol: "gearshape", label: "settings.title") { showsSettings = true }
            Spacer()
            if model.isSyncing {
                ProgressView().controlSize(.small).tint(Theme.Colors.secondaryText)
            }
            if model.access.showsUpsell {
                CircleButton(symbol: "crown.fill", filled: true, label: "pro.title") { paywall = PaywallRequest() }
            }
        }
        .overlay {
            Text("app.name").font(.system(size: 17, weight: .semibold)).foregroundStyle(Theme.Colors.primaryText)
        }
        .padding(.horizontal, Theme.Spacing.screen)
        .padding(.vertical, Theme.Spacing.s)
        .background(Theme.Colors.background.opacity(0.94).ignoresSafeArea(edges: .top))
    }

    /// First launch after onboarding shows the paywall once the wall is
    /// visible; later launches may ask for a review after real use.
    private func firstAppearance() async {
        // Sync runs on its own; prompts below must not wait for years of backfill.
        Task { await model.refresh() }
        switch DebugFlags.screen {
        case "paywall": paywall = PaywallRequest(); return
        case "paywall-steps": paywall = PaywallRequest(highlight: .steps); return
        case "settings": showsSettings = true; return
        case "months": model.preferences.wallStyle = .month
        case "weeks": model.preferences.wallStyle = .weeks
        case "recap": showsRecap = true; return
        case let screen? where screen.hasPrefix("detail-"):
            path = [Metric(rawValue: String(screen.dropFirst(7))) ?? .steps]; return
        default: break
        }
        let key = "onboarding_paywall_shown"
        // Only once access is certain, so paying users never see it.
        if !UserDefaults.standard.bool(forKey: key), await purchases.waitUntilResolved(), model.access == .free {
            UserDefaults.standard.set(true, forKey: key)
            try? await Task.sleep(for: .seconds(1.2))
            paywall = PaywallRequest()
        } else if TrialRecap.shouldShow(trialEnd: purchases.trialEnd, access: model.access) {
            TrialRecap.markShown()
            showsRecap = true
        } else if model.hasAnyData, ReviewPrompter.recordLaunchAndCheck() {
            requestReview()
        }
    }
}

/// Subtle press feedback for tappable cards.
struct CardButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.snappy(duration: 0.18), value: configuration.isPressed)
    }
}

/// Floating glass capsule switching between the weeks wall and month blocks.
struct WallStyleSwitcher: View {
    @Binding var selection: WallStyle
    @Namespace private var highlight

    var body: some View {
        HStack(spacing: Theme.Spacing.xs) {
            item(.weeks, symbol: "square.grid.3x3.fill", label: "home.style.weeks")
            item(.month, symbol: "calendar", label: "home.style.months")
        }
        .padding(5)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay(Capsule().strokeBorder(Theme.Colors.cardBorder, lineWidth: 1))
        .shadow(color: .black.opacity(0.18), radius: 16, y: 6)
    }

    private func item(_ style: WallStyle, symbol: String, label: LocalizedStringKey) -> some View {
        Button {
            withAnimation(.snappy) { selection = style }
        } label: {
            Image(systemName: symbol)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(selection == style ? Theme.Colors.primaryText : Theme.Colors.tertiaryText)
                .frame(width: 58, height: 46)
                .background {
                    if selection == style {
                        Capsule().fill(Theme.Colors.control).matchedGeometryEffect(id: "pill", in: highlight)
                    }
                }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Text(label))
        .accessibilityAddTraits(selection == style ? .isSelected : [])
    }
}

private struct EmptyMetricsView: View {
    let openSettings: () -> Void

    var body: some View {
        VStack(spacing: Theme.Spacing.m) {
            Text("home.empty.title").font(.cardTitle)
            Button("home.empty.action", action: openSettings).foregroundStyle(Theme.Colors.accent)
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.xxl)
        .surface()
    }
}
