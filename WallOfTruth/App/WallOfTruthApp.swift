import SwiftUI

@main
struct WallOfTruthApp: App {
    @State private var model = AppModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .environment(model.purchases)
                .preferredColorScheme(model.preferences.theme.colorScheme)
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
    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}
