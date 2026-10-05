import SwiftUI
import UserNotifications

@main
struct WallOfTruthApp: App {
    @State private var model = AppModel()
    @Environment(\.scenePhase) private var scenePhase

    init() {
        // Builds before 2.0 scheduled a trial reminder; the trial no longer exists.
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["trial-ending"])
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .environment(model.purchases)
                .onAppear { model.preferences.theme.apply() }
                .onChange(of: model.preferences.theme) { _, theme in theme.apply() }
                .task { await model.purchases.load() }
                .onChange(of: scenePhase) { _, phase in
                    guard phase == .active else { return }
                    Task { await model.purchases.refreshAccess() }
                    if model.preferences.onboardingCompleted {
                        Task { await model.refresh() }
                    }
                }
        }
    }
}

extension ThemePreference {
    var interfaceStyle: UIUserInterfaceStyle {
        switch self {
        case .system: .unspecified
        case .light: .light
        case .dark: .dark
        }
    }

    /// Overrides the whole window, so open sheets switch too and "System"
    /// keeps tracking the device appearance live (`preferredColorScheme`
    /// leaves presented sheets stuck in the previous style).
    @MainActor func apply() {
        for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
            scene.windows.forEach { $0.overrideUserInterfaceStyle = interfaceStyle }
        }
    }
}
