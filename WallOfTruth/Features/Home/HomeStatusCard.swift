import SwiftUI

/// What the home screen should explain before any wall has data.
enum HomeStatus: Equatable {
    /// First sync in progress.
    case loading
    /// Synced, but Health returned nothing (access denied or no data yet).
    case noData

    static func resolve(hasData: Bool, isSyncing: Bool, hasSynced: Bool) -> HomeStatus? {
        guard !hasData else { return nil }
        if isSyncing || !hasSynced { return .loading }
        return .noData
    }
}

/// Card shown above the walls while the first sync runs, or when Health
/// gave us nothing, so an empty wall never looks broken.
struct HomeStatusCard: View {
    let status: HomeStatus
    let retry: () -> Void
    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.l) {
            HStack(spacing: Theme.Spacing.m + 2) {
                tile
                VStack(alignment: .leading, spacing: 3) {
                    Text(status == .loading ? "status.loading.title" : "status.empty.title")
                        .font(.cardTitle).foregroundStyle(Theme.Colors.primaryText)
                    Text(status == .loading ? "status.loading.detail" : "status.empty.detail")
                        .font(.cardSubtitle).foregroundStyle(Theme.Colors.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            if status == .loading {
                LoadingWall()
            } else {
                HStack(spacing: Theme.Spacing.s) {
                    Button("settings.health") { openURL(URL(string: "x-apple-health://")!) }
                        .buttonStyle(CapsuleButtonStyle(filled: true))
                    Button("status.retry", action: retry)
                        .buttonStyle(CapsuleButtonStyle(filled: false))
                }
            }
        }
        .padding(Theme.Spacing.l)
        .surface(radius: Theme.Radius.card)
        .accessibilityElement(children: .combine)
    }

    private var tile: some View {
        let palette = Palette.with(id: status == .loading ? "neutral" : "rose")
        return RoundedRectangle(cornerRadius: Theme.Size.iconTile * 0.28, style: .continuous)
            .fill(palette.color.opacity(Theme.Grid.tileTint))
            .frame(width: Theme.Size.iconTile, height: Theme.Size.iconTile)
            .overlay {
                if status == .loading {
                    ProgressView().tint(palette.color)
                } else {
                    Image(systemName: "heart.fill").font(.system(size: 19, weight: .semibold)).foregroundStyle(palette.color)
                }
            }
    }
}

/// A wall whose cells light up in a slow wave while data loads, the
/// app's own take on a skeleton loader.
struct LoadingWall: View {
    var weeks = Theme.Grid.cardWeeks

    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 30)) { context in
            let phase = context.date.timeIntervalSinceReferenceDate
            let palette = Palette.with(id: "neutral")
            Canvas { canvas, size in
                let cell = WeekGridLayout.cell(width: size.width, weeks: weeks)
                let pitch = cell * (1 + Theme.Grid.gapFraction)
                for column in 0..<weeks {
                    for row in 0..<7 {
                        // A diagonal wave sweeping left to right.
                        let wave = sin(phase * 2.4 - Double(column) * 0.32 - Double(row) * 0.18)
                        let level = wave > 0.6 ? 2 : (wave > 0.1 ? 1 : 0)
                        let rect = CGRect(x: CGFloat(column) * pitch, y: CGFloat(row) * pitch, width: cell, height: cell)
                        HeatmapCell.draw(in: &canvas, rect: rect, color: palette.color(level: level))
                    }
                }
            }
        }
        .aspectRatio(WeekGridLayout.aspectRatio(weeks: weeks), contentMode: .fit)
        .accessibilityHidden(true)
    }
}

/// Compact capsule button used inside cards.
struct CapsuleButtonStyle: ButtonStyle {
    let filled: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(filled ? Theme.Colors.onAccent : Theme.Colors.primaryText)
            .padding(.horizontal, Theme.Spacing.l)
            .frame(height: 38)
            .background(Capsule().fill(filled ? Theme.Colors.accent : Theme.Colors.control))
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}
