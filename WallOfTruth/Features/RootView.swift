import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        Group {
            if DebugFlags.screen == "widgets" {
                #if DEBUG
                WidgetGallery()
                #endif
            } else if model.preferences.onboardingCompleted {
                HomeView()
            } else {
                OnboardingView()
            }
        }
        .onOpenURL { model.pendingLink = DeepLink.parse($0) }
        .tint(Theme.Colors.accent)
        .foregroundStyle(Theme.Colors.primaryText)
    }
}
