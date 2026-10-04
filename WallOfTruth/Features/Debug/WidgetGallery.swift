#if DEBUG
import SwiftUI
import WidgetKit

/// Renders every widget layout at its real size so they can be reviewed in
/// the simulator (`-Screen widgets`). Debug builds only.
struct WidgetGallery: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let snapshot = WidgetSnapshot.make(preferences: model.preferences, histories: model.histories, access: model.access)
        switch DebugFlags.gallery {
        case "home": showcase(snapshot, page: 1)
        case "home2": showcase(snapshot, page: 2)
        default: all(snapshot)
        }
    }

    /// Clean Home Screen arrangement for marketing shots (`-Gallery home`).
    private func showcase(_ snapshot: WidgetSnapshot, page: Int) -> some View {
        VStack(spacing: 28) {
            if page == 1 {
                HStack(spacing: 24) {
                    tile(.systemSmall, metric: .calories, snapshot: snapshot)
                    tile(.systemSmall, metric: .steps, snapshot: snapshot)
                }
                tile(.systemMedium, metric: .exercise, snapshot: snapshot)
                tile(.systemLarge, metric: .sleep, snapshot: snapshot)
            } else {
                OverviewWidgetView(entry: OverviewEntry(date: Date(), snapshot: snapshot), familyOverride: .systemMedium)
                    .modifier(WidgetFrame(size: CGSize(width: 364, height: 170)))
                tile(.systemMedium, metric: .steps, snapshot: snapshot)
                HStack(spacing: 24) {
                    tile(.systemSmall, metric: .stand, snapshot: snapshot)
                    tile(.systemSmall, metric: .floors, snapshot: snapshot)
                }
                tile(.systemMedium, metric: .calories, snapshot: snapshot)
            }
        }
        .padding(.top, 40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(LinearGradient(colors: [Color(red: 0.36, green: 0.30, blue: 0.94), Color(red: 0.07, green: 0.62, blue: 0.62)],
                                   startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea())
    }

    private func all(_ snapshot: WidgetSnapshot) -> some View {
        ScrollView {
            VStack(spacing: 20) {
                HStack(spacing: 16) {
                    tile(.accessoryRectangular, metric: .calories, snapshot: snapshot)
                    tile(.accessoryCircular, metric: .calories, snapshot: snapshot)
                }
                HStack(spacing: 20) {
                    tile(.systemSmall, metric: .calories, snapshot: snapshot)
                    tile(.systemSmall, metric: .steps, snapshot: snapshot)
                }
                tile(.systemMedium, metric: .exercise, snapshot: snapshot)
                OverviewWidgetView(entry: OverviewEntry(date: Date(), snapshot: snapshot), familyOverride: .systemMedium)
                    .modifier(WidgetFrame(size: CGSize(width: 364, height: 170)))
                tile(.systemLarge, metric: .sleep, snapshot: snapshot)
            }
            .padding(.vertical, 20)
        }
        .background(LinearGradient(colors: [.indigo.opacity(0.5), .teal.opacity(0.4)], startPoint: .top, endPoint: .bottom).ignoresSafeArea())
    }

    private func tile(_ family: WidgetFamily, metric: Metric, snapshot: WidgetSnapshot) -> some View {
        let size: CGSize = switch family {
        case .systemSmall: CGSize(width: 170, height: 170)
        case .systemMedium: CGSize(width: 364, height: 170)
        case .systemLarge: CGSize(width: 364, height: 382)
        case .accessoryRectangular: CGSize(width: 172, height: 76)
        default: CGSize(width: 76, height: 76)
        }
        return MetricWidgetView(entry: MetricEntry(date: Date(), metric: metric, snapshot: snapshot), familyOverride: family)
            .modifier(WidgetFrame(size: size, accessory: family == .accessoryRectangular || family == .accessoryCircular))
    }
}

private struct WidgetFrame: ViewModifier {
    let size: CGSize
    var accessory = false

    func body(content: Content) -> some View {
        content
            .padding(accessory ? 0 : 16)
            .frame(width: size.width, height: size.height)
            .background(accessory ? AnyShapeStyle(.clear) : AnyShapeStyle(Theme.Colors.card), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .foregroundStyle(accessory ? Color.white : Theme.Colors.primaryText)
    }
}
#endif
