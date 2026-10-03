import SwiftUI

/// Rounded square with the metric symbol: tinted (default) or solid.
struct IconTile: View {
    let metric: Metric
    let palette: Palette
    var size: CGFloat = Theme.Size.iconTile
    var solid = false

    var body: some View {
        RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
            .fill(solid ? palette.color : palette.color.opacity(Theme.Grid.tileTint))
            .frame(width: size, height: size)
            .overlay {
                Image(systemName: metric.symbol)
                    .font(.system(size: size * 0.42, weight: .semibold))
                    .foregroundStyle(solid ? Theme.Colors.onMetric : palette.color)
            }
            .accessibilityHidden(true)
    }
}

/// HabitKit's right-hand status button: a solid tile with a check once the
/// goal is met, otherwise a circular progress ring around the metric glyph.
struct GoalBadge: View {
    let progress: Double
    let palette: Palette
    var symbol: String = "plus"
    var size: CGFloat = Theme.Size.iconTile

    var body: some View {
        Group {
            if progress >= 1 {
                RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
                    .fill(palette.color)
                    .overlay {
                        Image(systemName: "checkmark")
                            .font(.system(size: size * 0.38, weight: .bold))
                            .foregroundStyle(Theme.Colors.onMetric)
                    }
            } else {
                ZStack {
                    Circle().fill(Theme.Colors.control)
                    Circle().strokeBorder(palette.color.opacity(0.22), lineWidth: size * 0.085)
                    Circle()
                        .inset(by: size * 0.0425)
                        .trim(from: 0, to: max(0.03, progress))
                        .stroke(palette.color, style: StrokeStyle(lineWidth: size * 0.085, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Image(systemName: symbol)
                        .font(.system(size: size * 0.32, weight: .semibold))
                        .foregroundStyle(palette.color.opacity(0.75))
                }
            }
        }
        .frame(width: size, height: size)
        .accessibilityElement()
        .accessibilityLabel(Text(progress.formatted(.percent.precision(.fractionLength(0)))))
    }
}

/// Card surface tinted at the top with the metric color, like HabitKit.
struct MetricCardBackground: ViewModifier {
    let palette: Palette

    func body(content: Content) -> some View {
        content
            .background {
                RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                    .fill(Theme.Colors.card)
                    .overlay {
                        RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                            .fill(LinearGradient(colors: [palette.color.opacity(Theme.Grid.cardTint), .clear], startPoint: .top, endPoint: .bottom))
                    }
                    .overlay {
                        RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                            .strokeBorder(Theme.Colors.cardBorder, lineWidth: 1)
                    }
            }
    }
}

/// Neutral rounded surface for calendars, tiles and lists.
struct SurfaceBackground: ViewModifier {
    var radius: CGFloat = Theme.Radius.surface

    func body(content: Content) -> some View {
        content.background {
            RoundedRectangle(cornerRadius: radius, style: .continuous)
                .fill(Theme.Colors.surface)
                .overlay {
                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .strokeBorder(Theme.Colors.surfaceBorder, lineWidth: 1)
                }
        }
    }
}

extension View {
    func metricCard(_ palette: Palette) -> some View { modifier(MetricCardBackground(palette: palette)) }
    func surface(radius: CGFloat = Theme.Radius.surface) -> some View { modifier(SurfaceBackground(radius: radius)) }
}

/// Pill with an icon and mono text, tinted with a color.
struct Chip: View {
    let symbol: String
    let text: String
    let color: Color

    var body: some View {
        HStack(spacing: Theme.Spacing.xs + 2) {
            Image(systemName: symbol).font(.system(size: 12, weight: .semibold))
            Text(text).font(.mono(13, weight: .medium))
        }
        .foregroundStyle(color)
        .padding(.horizontal, Theme.Spacing.m)
        .frame(height: 30)
        .background(Capsule().fill(color.opacity(0.13)))
    }
}

/// Small "PRO" badge.
struct ProBadge: View {
    var body: some View {
        Text("pro.badge")
            .font(.mono(10, weight: .bold))
            .tracking(1)
            .foregroundStyle(Theme.Colors.onAccent)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(Capsule().fill(Theme.Colors.accent))
    }
}

/// "Unlock" pill over a blurred, locked wall.
struct LockedPill: View {
    var body: some View {
        Label("pro.unlock", systemImage: "lock.open.fill")
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(Theme.Colors.onAccent)
            .padding(.horizontal, Theme.Spacing.l)
            .frame(height: 34)
            .background(Capsule().fill(Theme.Colors.accent))
            .shadow(color: .black.opacity(0.12), radius: 8, y: 3)
    }
}

/// Gold star for days 50% past the top range.
struct StarMark: View {
    var size: CGFloat = 16

    var body: some View {
        Image(systemName: "star.fill")
            .font(.system(size: size * 0.62, weight: .bold))
            .foregroundStyle(Theme.Colors.onMetric)
            .frame(width: size, height: size)
            .background(Circle().fill(Theme.Colors.star))
            .accessibilityLabel(Text("a11y.exceptional"))
    }
}
