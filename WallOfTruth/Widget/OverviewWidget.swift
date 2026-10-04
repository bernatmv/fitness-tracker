import SwiftUI
import WidgetKit

struct OverviewEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
}

struct OverviewProvider: TimelineProvider {
    func placeholder(in context: Context) -> OverviewEntry { OverviewEntry(date: Date(), snapshot: nil) }

    func getSnapshot(in context: Context, completion: @escaping (OverviewEntry) -> Void) {
        completion(OverviewEntry(date: Date(), snapshot: WidgetSnapshot.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<OverviewEntry>) -> Void) {
        let snapshot = WidgetSnapshot.load()
        let entries = WidgetSchedule.entryDates(access: snapshot?.access).map { OverviewEntry(date: $0, snapshot: snapshot) }
        completion(Timeline(entries: entries, policy: .after(WidgetSchedule.nextRefresh(access: snapshot?.access))))
    }
}

/// HabitKit's multi-habit widget: one row per metric, last days as squares.
struct OverviewWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "OverviewWidget", provider: OverviewProvider()) { entry in
            OverviewWidgetView(entry: entry)
                .containerBackground(for: .widget) { Theme.Colors.card }
        }
        .configurationDisplayName(Text("widget.overview.title"))
        .description(Text("widget.overview.description"))
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct OverviewWidgetView: View {
    let entry: OverviewEntry
    /// Set by the in-app debug gallery, which has no widget environment.
    var familyOverride: WidgetFamily?
    @Environment(\.widgetFamily) private var environmentFamily
    private var family: WidgetFamily { familyOverride ?? environmentFamily }
    @Environment(\.widgetRenderingMode) private var renderingMode

    private let days = 8
    private var today: Day { Day(entry.date) }
    private var access: Access { entry.snapshot?.access ?? .free }

    /// Unlocked metrics first; locked ones fill the rest as dimmed rows.
    private var metrics: [Metric] {
        let enabled = (entry.snapshot?.order ?? Metric.allCases).filter { entry.snapshot?.entries[$0]?.settings.enabled ?? true }
        let sorted = enabled.filter { access.canView($0, now: entry.date) } + enabled.filter { !access.canView($0, now: entry.date) }
        return Array(sorted.prefix(family == .systemLarge ? 6 : 3))
    }

    var body: some View {
        VStack(spacing: 6) {
            HStack(spacing: 6) {
                Color.clear.frame(maxWidth: .infinity, maxHeight: 1)
                ForEach(0..<days, id: \.self) { offset in
                    let day = today.advanced(by: offset - days + 1)
                    Text(String(WeekdaySymbols.short(firstWeekday: 1)[day.weekday - 1].prefix(2)))
                        .font(.mono(10, weight: day == today ? .bold : .regular))
                        .foregroundStyle(day == today ? Theme.Colors.primaryText : Theme.Colors.tertiaryText)
                        .frame(maxWidth: .infinity)
                }
            }
            ForEach(metrics) { metric in row(metric) }
        }
        .frame(maxHeight: .infinity)
    }

    private func row(_ metric: Metric) -> some View {
        let item = entry.snapshot?.entries[metric] ?? WidgetSnapshot.Entry(settings: .defaults(for: metric), series: .empty)
        let palette = item.settings.palette
        let locked = !access.canView(metric, now: entry.date)
        return Link(destination: locked ? DeepLink.paywall : DeepLink.metric(metric)) {
            HStack(spacing: 6) {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(palette.color.opacity(Theme.Grid.tileTint))
                    .aspectRatio(1, contentMode: .fit)
                    .overlay {
                        Image(systemName: metric.symbol).font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.color)
                    }
                    .frame(maxWidth: .infinity)
                HStack(spacing: 6) {
                    ForEach(0..<days, id: \.self) { offset in
                        let day = today.advanced(by: offset - days + 1)
                        let level = locked ? Self.teaserLevel(offset: offset, metric: metric) : item.settings.scale.level(for: item.series[day])
                        RoundedRectangle(cornerRadius: 7, style: .continuous)
                            .fill(HeatmapStyle(series: item.series, scale: item.settings.scale, palette: palette,
                                               monochrome: renderingMode != .fullColor).color(level: level))
                            .aspectRatio(1, contentMode: .fit)
                            .overlay {
                                if day == today, !locked {
                                    RoundedRectangle(cornerRadius: 7, style: .continuous).strokeBorder(Theme.Colors.todayOutline, lineWidth: 1.5)
                                }
                            }
                            .frame(maxWidth: .infinity)
                    }
                }
                .frame(maxWidth: .infinity)
                .layoutPriority(1)
                .blur(radius: locked ? 2.5 : 0)
                .overlay { if locked { ProBadge() } }
            }
        }
    }

    /// A plausible, fixed pattern behind the blur of locked rows.
    static func teaserLevel(offset: Int, metric: Metric) -> Int {
        let seed = (Metric.allCases.firstIndex(of: metric) ?? 0) * 3
        return [2, 3, 1, 4, 3, 2, 4, 3, 1, 2][(offset + seed) % 10]
    }
}
