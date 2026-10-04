import SwiftUI

/// Pro upsell. Strategy: show the person their own locked walls (real data,
/// not stock art), frame the price as a one-time payment with no
/// subscription, and keep closing and restoring always one tap away. The
/// free calories tier is the trial.
struct PaywallView: View {
    var highlight: Metric?
    var isOnboarding = false
    @Environment(AppModel.self) private var model
    @Environment(PurchaseManager.self) private var purchases
    @Environment(\.dismiss) private var dismiss
    static let onboardingKey = "onboarding_paywall_shown"
    static var onboardingShown: Bool { UserDefaults.standard.bool(forKey: onboardingKey) }

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.xl) {
                title
                PaywallTeaser(metrics: teaserMetrics)
                if model.access.showsUpsell { plans }
                features
            }
            .padding(.horizontal, Theme.Spacing.xl)
            .padding(.top, Theme.Spacing.xxl + Theme.Spacing.l)
            .padding(.bottom, Theme.Spacing.xxl * 2)
        }
        .scrollIndicators(.hidden)
        .safeAreaInset(edge: .bottom) { footer }
        .overlay(alignment: .top) { closeBar }
        .screenBackground()
        .presentationDragIndicator(.hidden)
        .onChange(of: purchases.access) { _, access in
            // Bought Pro: done here.
            if access.isFullAccess { dismiss() }
        }
        .onAppear {
            // Marked only once actually on screen, so a refused presentation retries next launch.
            if isOnboarding { UserDefaults.standard.set(true, forKey: Self.onboardingKey) }
        }
        .alert(alertTitle, isPresented: Binding(get: { purchases.message != nil }, set: { if !$0 { purchases.message = nil } })) {
            Button("common.ok", role: .cancel) {}
        } message: {
            alertMessage
        }
        .task { if purchases.pro == nil { await purchases.loadProducts() } }
    }

    private var alertTitle: Text {
        switch purchases.message {
        case .restored: Text("pro.restored")
        case .nothingToRestore: Text("pro.nothing_restored.title")
        default: Text("common.error")
        }
    }

    private var alertMessage: Text {
        switch purchases.message {
        case .error(let text): Text(verbatim: text)
        case .nothingToRestore: Text("pro.nothing_restored")
        default: Text(verbatim: "")
        }
    }

    private var teaserMetrics: [Metric] {
        let locked = Metric.allCases.filter { !$0.isFree }
        guard let highlight, !highlight.isFree else { return Array(locked.prefix(3)) }
        return [highlight] + locked.filter { $0 != highlight }.prefix(2)
    }

    private var closeBar: some View {
        HStack {
            CircleButton(symbol: "xmark", label: "common.close") { dismiss() }
            Spacer()
            Button("pro.restore") { Task { await purchases.restore() } }
                .font(.scaled(15, weight: .medium))
                .foregroundStyle(Theme.Colors.secondaryText)
        }
        .padding(.horizontal, Theme.Spacing.l)
        .padding(.top, Theme.Spacing.l)
    }

    private var title: some View {
        VStack(spacing: Theme.Spacing.s) {
            (Text("pro.title.lead") + Text(" ") + Text("pro.title.pro").foregroundColor(Theme.Colors.accent))
                .font(.scaled(32, weight: .bold))
                .foregroundStyle(Theme.Colors.primaryText)
            Text("pro.subtitle")
                .font(.scaled(16))
                .foregroundStyle(Theme.Colors.secondaryText)
                .multilineTextAlignment(.center)
        }
        .padding(.top, Theme.Spacing.s)
    }

    private var features: some View {
        VStack(spacing: Theme.Spacing.l) {
            FeatureRow(symbol: "square.grid.3x3.fill", tint: Palette.with(id: "green").color, title: "pro.feature.metrics", detail: "pro.feature.metrics.detail")
            FeatureRow(symbol: "slider.horizontal.3", tint: Palette.with(id: "violet").color, title: "pro.feature.ranges", detail: "pro.feature.ranges.detail")
            FeatureRow(symbol: "rectangle.3.group.fill", tint: Palette.with(id: "sky").color, title: "pro.feature.widgets", detail: "pro.feature.widgets.detail")
            FeatureRow(symbol: "heart.fill", tint: Palette.with(id: "rose").color, title: "pro.feature.indie", detail: "pro.feature.indie.detail")
        }
        .padding(Theme.Spacing.l)
        .surface()
    }

    private var plans: some View {
        VStack(spacing: Theme.Spacing.s + 2) {
            PlanRow(selected: true, title: "pro.plan.lifetime", detail: Text("pro.plan.lifetime.detail"),
                    price: Text(verbatim: price), badge: "pro.plan.lifetime.badge") {}
        }
    }

    private var price: String { purchases.proPrice ?? "…" }

    /// Buying needs a loaded product.
    private var canBuy: Bool { purchases.proPrice != nil }

    private var footer: some View {
        VStack(spacing: Theme.Spacing.s) {
            Button {
                Task { await purchases.buyPro() }
            } label: {
                if purchases.isPurchasing || purchases.isLoadingProducts {
                    ProgressView().tint(Theme.Colors.onAccent)
                } else if !canBuy {
                    Text("pro.unavailable")
                } else {
                    Text(String(format: String(localized: "pro.cta.buy %@"), price))
                }
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(purchases.isPurchasing || purchases.isLoadingProducts)
            .simultaneousGesture(TapGesture().onEnded {
                if !canBuy { Task { await purchases.loadProducts() } }
            })
            if purchases.awaitingApproval {
                Text("pro.pending").font(.scaled(13, weight: .medium)).foregroundStyle(Theme.Colors.accent)
            }
            Text("pro.fineprint.lifetime")
            .font(.scaled(12))
            .foregroundStyle(Theme.Colors.tertiaryText)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: Theme.Spacing.l) {
                Link("pro.terms", destination: URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!)
                Link("settings.privacy", destination: AppLinks.privacyPolicy)
            }
            .font(.scaled(12, weight: .medium))
            .foregroundStyle(Theme.Colors.secondaryText)
        }
        .padding(.horizontal, Theme.Spacing.xl)
        .padding(.top, Theme.Spacing.m)
        .padding(.bottom, Theme.Spacing.s)
        .background {
            Theme.Colors.background
                .mask(LinearGradient(stops: [.init(color: .clear, location: 0), .init(color: .black, location: 0.6)], startPoint: .top, endPoint: .bottom))
                .padding(.top, -Theme.Spacing.xxl - Theme.Spacing.l)
                .ignoresSafeArea()
        }
    }
}

private struct FeatureRow: View {
    let symbol: String
    let tint: Color
    let title: LocalizedStringKey
    let detail: LocalizedStringKey

    var body: some View {
        HStack(spacing: Theme.Spacing.m + 2) {
            Image(systemName: symbol)
                .font(.scaled(16, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 40, height: 40)
                .background(Circle().fill(tint.opacity(Theme.Grid.tileTint)))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.scaled(16, weight: .semibold)).foregroundStyle(Theme.Colors.primaryText)
                Text(detail).font(.scaled(14)).foregroundStyle(Theme.Colors.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }
}

private struct PlanRow: View {
    let selected: Bool
    let title: LocalizedStringKey
    let detail: Text
    let price: Text?
    let badge: LocalizedStringKey?
    let action: () -> Void

    @ViewBuilder private var titleAndBadge: some View {
        Text(title).font(.scaled(16, weight: .semibold)).foregroundStyle(Theme.Colors.primaryText)
        if let badge {
            Text(badge)
                .font(.mono(10, weight: .bold)).tracking(0.8).textCase(.uppercase)
                .lineLimit(1).fixedSize()
                .foregroundStyle(Theme.Colors.onAccent)
                .padding(.horizontal, 7).padding(.vertical, 3)
                .background(Capsule().fill(Theme.Colors.accent))
        }
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.m) {
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.scaled(22))
                    .foregroundStyle(selected ? Theme.Colors.accent : Theme.Colors.tertiaryText)
                VStack(alignment: .leading, spacing: 2) {
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: Theme.Spacing.s) { titleAndBadge }
                        VStack(alignment: .leading, spacing: 4) { titleAndBadge }
                    }
                    detail.font(.scaled(13)).foregroundStyle(Theme.Colors.secondaryText)
                }
                Spacer(minLength: 0)
                price?.font(.mono(16, weight: .semibold)).foregroundStyle(Theme.Colors.primaryText)
            }
            .padding(.horizontal, Theme.Spacing.l)
            .frame(minHeight: 68)
            .background {
                RoundedRectangle(cornerRadius: Theme.Radius.field, style: .continuous)
                    .fill(selected ? Theme.Colors.accentSoft : Theme.Colors.surface)
                    .overlay {
                        RoundedRectangle(cornerRadius: Theme.Radius.field, style: .continuous)
                            .strokeBorder(selected ? Theme.Colors.accent : Theme.Colors.surfaceBorder, lineWidth: selected ? 1.5 : 1)
                    }
            }
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}
