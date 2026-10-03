import SwiftUI

/// 40pt round header button (HabitKit top bar).
struct CircleButton: View {
    let symbol: String
    var filled = false
    let label: LocalizedStringKey
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(filled ? Theme.Colors.onAccent : Theme.Colors.primaryText)
                .frame(width: Theme.Size.circleButton, height: Theme.Size.circleButton)
                .background(Circle().fill(filled ? Theme.Colors.accent : Theme.Colors.control))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Text(label))
    }
}

/// Full-width accent capsule.
struct PrimaryButtonStyle: ButtonStyle {
    var color: Color = Theme.Colors.accent

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(Theme.Colors.onAccent)
            .frame(maxWidth: .infinity)
            .frame(height: Theme.Size.cta)
            .background(Capsule().fill(color))
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.snappy(duration: 0.15), value: configuration.isPressed)
    }
}

/// Uppercase mono section label (HabitKit forms).
struct SectionLabel: View {
    let key: LocalizedStringKey

    init(_ key: LocalizedStringKey) { self.key = key }

    var body: some View {
        Text(key)
            .font(.mono(12, weight: .medium))
            .tracking(1.5)
            .textCase(.uppercase)
            .foregroundStyle(Theme.Colors.tertiaryText)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Screen background applied to every screen root.
extension View {
    func screenBackground() -> some View {
        background(Theme.Colors.background.ignoresSafeArea())
    }
}

/// Opaque bar background that fades into the content below, so scrolled
/// content never shows through a floating header.
struct TopBarBackground: ViewModifier {
    func body(content: Content) -> some View {
        content.background {
            VStack(spacing: 0) {
                Theme.Colors.background
                LinearGradient(colors: [Theme.Colors.background, Theme.Colors.background.opacity(0)], startPoint: .top, endPoint: .bottom)
                    .frame(height: Theme.Spacing.l)
                    .padding(.bottom, -Theme.Spacing.l)
            }
            .ignoresSafeArea(edges: .top)
        }
    }
}

extension View {
    func topBarBackground() -> some View { modifier(TopBarBackground()) }
}

/// Sheet header: close button leading (HabitKit), centred title.
struct SheetHeader: View {
    let title: Text
    let close: () -> Void

    var body: some View {
        ZStack {
            title.font(.system(size: 17, weight: .semibold)).foregroundStyle(Theme.Colors.primaryText)
            HStack {
                CircleButton(symbol: "xmark", label: "common.close", action: close)
                Spacer()
            }
        }
        .padding(Theme.Spacing.l)
        .topBarBackground()
    }
}
