import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

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
        // Font.scaled sizes are computed once per body; rebuild when the
        // text size changes so they follow it without a relaunch.
        .id(dynamicTypeSize)
        .onOpenURL { model.pendingLink = DeepLink.parse($0) }
        .tint(Theme.Colors.accent)
        .foregroundStyle(Theme.Colors.primaryText)
    }
}
