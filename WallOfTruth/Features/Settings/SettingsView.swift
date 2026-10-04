import StoreKit
import SwiftUI

struct SettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(PurchaseManager.self) private var purchases
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @Environment(\.requestReview) private var requestReview
    @State private var paywall: PaywallRequest?
    @State private var configuring: Metric?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                ProStatusCard { paywall = PaywallRequest() }
                section("settings.metrics") { metricsList }
                section("settings.appearance") { themePicker }
                section("settings.data") { dataRows }
                section("settings.about") { aboutRows }
                Text(String(format: String(localized: "settings.version %@"), Bundle.main.appVersion))
                    .font(.mono(12)).foregroundStyle(Theme.Colors.tertiaryText)
                    .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .scrollIndicators(.hidden)
        .safeAreaInset(edge: .top) {
            SheetHeader(title: Text("settings.title")) { dismiss() }
        }
        .screenBackground()
        .sheet(item: $paywall) { PaywallView(highlight: $0.highlight) }
        .sheet(item: $configuring) { MetricConfigView(metric: $0) }
        .alert(alertTitle, isPresented: Binding(get: { purchases.message != nil }, set: { if !$0 { purchases.message = nil } })) {
            Button("common.ok", role: .cancel) {}
        } message: {
            switch purchases.message {
            case .nothingToRestore: Text("pro.nothing_restored")
            case .error(let text): Text(verbatim: text)
            default: EmptyView()
            }
        }
    }

    private var alertTitle: Text {
        switch purchases.message {
        case .restored: Text("pro.restored")
        case .nothingToRestore: Text("pro.nothing_restored.title")
        default: Text("common.error")
        }
    }

    private func section<Content: View>(_ title: LocalizedStringKey, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.s) {
            SectionLabel(title).padding(.leading, Theme.Spacing.xs)
            VStack(spacing: 0) { content() }
                .padding(.horizontal, Theme.Spacing.l)
                .surface()
        }
    }

    private var metricsList: some View {
        ForEach(Array(model.preferences.orderedMetrics.enumerated()), id: \.element) { index, metric in
            let settings = model.preferences[metric]
            let locked = !model.access.canView(metric)
            HStack(spacing: Theme.Spacing.m) {
                Button {
                    if locked { paywall = PaywallRequest(highlight: metric) } else { configuring = metric }
                } label: {
                    HStack(spacing: Theme.Spacing.m) {
                        IconTile(metric: metric, palette: settings.palette, size: 32)
                        Text(metric.title).font(.label).foregroundStyle(Theme.Colors.primaryText)
                        if locked { ProBadge() }
                        Spacer()
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                Toggle("", isOn: Binding(get: { settings.enabled }, set: { value in model.update(metric) { $0.enabled = value } }))
                    .labelsHidden()
                    .tint(settings.palette.color)
                    .accessibilityLabel(Text(metric.title))
            }
            .padding(.vertical, Theme.Spacing.s + 2)
            if index < Metric.allCases.count - 1 { Divider().overlay(Theme.Colors.separator) }
        }
    }

    private var themePicker: some View {
        Picker("settings.theme", selection: Binding(get: { model.preferences.theme }, set: { model.preferences.theme = $0 })) {
            Text("settings.theme.system").tag(ThemePreference.system)
            Text("settings.theme.light").tag(ThemePreference.light)
            Text("settings.theme.dark").tag(ThemePreference.dark)
        }
        .pickerStyle(.segmented)
        .padding(.vertical, Theme.Spacing.m)
    }

    @ViewBuilder private var dataRows: some View {
        row("arrow.triangle.2.circlepath", "settings.resync", busy: model.isSyncing) { Task { await model.resyncAll() } }
        Divider().overlay(Theme.Colors.separator)
        row("heart.fill", "settings.health") { openURL(URL(string: "x-apple-health://")!) }
        Divider().overlay(Theme.Colors.separator)
        row("globe", "settings.language") { openURL(URL(string: UIApplication.openSettingsURLString)!) }
    }

    @ViewBuilder private var aboutRows: some View {
        row("star", "settings.rate") { requestReview() }
        Divider().overlay(Theme.Colors.separator)
        row("lock.shield", "settings.privacy") { openURL(AppLinks.privacyPolicy) }
        if purchases.access.showsUpsell {
            Divider().overlay(Theme.Colors.separator)
            row("arrow.clockwise", "pro.restore") { Task { await purchases.restore() } }
        }
    }

    private func row(_ symbol: String, _ title: LocalizedStringKey, busy: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.m) {
                Image(systemName: symbol).font(.system(size: 15, weight: .medium)).frame(width: 24)
                    .foregroundStyle(Theme.Colors.secondaryText)
                Text(title).font(.label).foregroundStyle(Theme.Colors.primaryText)
                Spacer()
                if busy {
                    ProgressView().controlSize(.small).tint(Theme.Colors.secondaryText)
                } else {
                    Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.Colors.tertiaryText)
                }
            }
            .padding(.vertical, Theme.Spacing.m + 2)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(busy)
    }
}

/// Upgrade card for free users, a thank-you for paying ones.
private struct ProStatusCard: View {
    let upgrade: () -> Void
    @Environment(PurchaseManager.self) private var purchases

    var body: some View {
        let upsell = purchases.access.showsUpsell
        Button(action: upgrade) {
            HStack(spacing: Theme.Spacing.m) {
                Image(systemName: upsell ? "crown.fill" : "checkmark.seal.fill")
                    .font(.scaled(20, weight: .semibold))
                    .foregroundStyle(Theme.Colors.onAccent)
                    .frame(width: 48, height: 48)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Theme.Colors.accent))
                VStack(alignment: .leading, spacing: 2) {
                    Text(upsell ? "settings.pro.upsell" : "settings.pro.owned").font(.scaled(17, weight: .semibold))
                        .foregroundStyle(Theme.Colors.primaryText)
                    Text(upsell ? "settings.pro.upsell.detail" : "settings.pro.owned.detail")
                        .font(.scaled(13)).foregroundStyle(Theme.Colors.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                if upsell { Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.Colors.tertiaryText) }
            }
            .padding(Theme.Spacing.l)
            .background {
                RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                    .fill(LinearGradient(colors: [Theme.Colors.accentSoft, Theme.Colors.surface], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous).strokeBorder(Theme.Colors.surfaceBorder, lineWidth: 1))
            }
        }
        .buttonStyle(CardButtonStyle())
        .disabled(!upsell)
    }
}

enum AppLinks {
    /// Localized privacy page where one exists (App Review 5.1.1(i)).
    static var privacyPolicy: URL {
        let published = ["en", "es", "fr", "it", "de", "ca"]
        let language = Locale.current.language.languageCode?.identifier ?? "en"
        return URL(string: "https://www.wall-of-truth.com/\(published.contains(language) ? language : "en")/privacy/")!
    }
}

extension Bundle {
    var appVersion: String {
        let version = infoDictionary?["CFBundleShortVersionString"] as? String ?? "?"
        let build = infoDictionary?["CFBundleVersion"] as? String ?? "?"
        return "\(version) (\(build))"
    }
}
