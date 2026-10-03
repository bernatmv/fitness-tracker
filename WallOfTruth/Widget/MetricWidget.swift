import SwiftUI
import WidgetKit

struct MetricEntry: TimelineEntry {
    let date: Date
    let metric: Metric
    let snapshot: WidgetSnapshot?

    var entry: WidgetSnapshot.Entry {
        snapshot?.entries[metric] ?? WidgetSnapshot.Entry(settings: .defaults(for: metric), series: .empty)
    }

    var locked: Bool { !(snapshot?.access ?? .free).canView(metric, now: date) }
    var style: HeatmapStyle { HeatmapStyle(series: entry.series, scale: entry.settings.scale, palette: entry.settings.palette) }
    var today: Day { Day(date) }
    var todayValue: Double { entry.series[today] }
    var progress: Double { entry.settings.scale.goal > 0 ? todayValue / entry.settings.scale.goal : 0 }
}

struct MetricProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> MetricEntry {
        MetricEntry(date: Date(), metric: .calories, snapshot: nil)
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> MetricEntry {
        MetricEntry(date: Date(), metric: configuration.metricType.metric, snapshot: WidgetSnapshot.load())
    }

    /// One entry per refresh; the app reloads timelines after every sync,
    /// and a midnight refresh starts the new day's cell.
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<MetricEntry> {
        let snapshot = WidgetSnapshot.load()
        let dates = WidgetSchedule.entryDates(access: snapshot?.access)
        let entries = dates.map { MetricEntry(date: $0, metric: configuration.metricType.metric, snapshot: snapshot) }
        return Timeline(entries: entries, policy: .after(WidgetSchedule.nextRefresh(access: snapshot?.access)))
    }

}

enum WidgetSchedule {
    /// Now, plus the moment a trial ends, so locked metrics lock on time
    /// even if WidgetKit delays the next reload.
    static func entryDates(now: Date = Date(), access: Access?) -> [Date] {
        if case .trial(let endsAt)? = access, endsAt > now { return [now, endsAt] }
        return [now]
    }

    /// Next midnight, or within the hour as a self-healing fallback.
    static func nextRefresh(now: Date = Date(), access: Access? = nil) -> Date {
        let midnight = Day(now).advanced(by: 1).date()
        var next = min(midnight, now.addingTimeInterval(3600))
        // Re-render right when a trial ends so its metrics lock on time.
        if case .trial(let endsAt)? = access, endsAt > now { next = min(next, endsAt) }
        return next
    }
}

struct MetricWidget: Widget {
    /// Same kind as the React Native widget so placed widgets keep working.
    let kind = "FitnessTrackerWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: MetricProvider()) { entry in
            MetricWidgetView(entry: entry)
                .containerBackground(for: .widget) { Theme.Colors.card }
                .widgetURL(entry.locked ? DeepLink.paywall : DeepLink.metric(entry.metric))
        }
        .configurationDisplayName(Text("widget.title"))
        .description(Text("widget.description"))
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryCircular])
    }
}

struct MetricWidgetView: View {
    let entry: MetricEntry
    /// Set by the in-app debug gallery, which has no widget environment.
    var familyOverride: WidgetFamily?
    @Environment(\.widgetFamily) private var environmentFamily
    private var family: WidgetFamily { familyOverride ?? environmentFamily }

    var body: some View {
        switch family {
        case .systemSmall: small
        case .systemMedium: medium
        case .systemLarge: large
        case .accessoryRectangular: rectangular
        case .accessoryCircular: circular
        default: small
        }
    }

    private var palette: Palette { entry.entry.settings.palette }

    // MARK: Home screen

    private var small: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: Theme.Spacing.s) {
                IconTile(metric: entry.metric, palette: palette, size: 34, solid: true)
                Text(entry.metric.title).font(.system(size: 17, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.75)
            }
            Spacer(minLength: Theme.Spacing.s)
            wall(weeks: 10)
        }
    }

    private var medium: some View {
        VStack(alignment: .leading, spacing: 0) {
            header(tile: 40)
            Spacer(minLength: Theme.Spacing.s)
            wall(weeks: 24)
        }
    }

    private var large: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            header(tile: 44)
            MonthBlocksHeatmap(style: entry.style, months: MonthBlockLayout.months(count: 3, endingAt: entry.today), today: entry.today)
                .blur(radius: entry.locked ? 4 : 0)
                .overlay { if entry.locked { LockedPill() } }
            Spacer(minLength: 0)
            Divider().overlay(Theme.Colors.separator)
            HStack {
                legend
                Spacer()
                Chip(symbol: "flame.fill", text: "\(streak)", color: palette.color)
                    .opacity(entry.locked ? 0 : 1)
            }
        }
    }

    private func header(tile: CGFloat) -> some View {
        HStack(spacing: Theme.Spacing.m) {
            IconTile(metric: entry.metric, palette: palette, size: tile)
            VStack(alignment: .leading, spacing: 1) {
                Text(entry.metric.title).font(.system(size: 16, weight: .semibold)).lineLimit(1)
                Text(entry.locked ? String(localized: "pro.locked") : MetricFormat.value(entry.todayValue, for: entry.metric))
                    .font(.system(size: 13)).foregroundStyle(Theme.Colors.secondaryText).lineLimit(1)
            }
            Spacer(minLength: 0)
            if !entry.locked { GoalBadge(progress: entry.progress, palette: palette, symbol: entry.metric.symbol, size: tile) }
        }
    }

    private func wall(weeks: Int) -> some View {
        WeekHeatmap(style: entry.style, weeks: weeks, end: entry.today, today: entry.today, fadeLeading: false)
            .blur(radius: entry.locked ? 4 : 0)
            .overlay { if entry.locked { LockedPill().scaleEffect(0.85) } }
    }

    private var legend: some View {
        HStack(spacing: 3) {
            ForEach(0..<ThresholdScale.levelCount, id: \.self) { level in
                RoundedRectangle(cornerRadius: 2.5, style: .continuous).fill(palette.color(level: level)).frame(width: 11, height: 11)
            }
        }
        .accessibilityHidden(true)
    }

    private var streak: Int {
        MetricStats(series: entry.entry.series, scale: entry.entry.settings.scale,
                    range: entry.today.advanced(by: -364)...entry.today, today: entry.today).currentStreak
    }

    // MARK: Lock screen

    private var rectangular: some View {
        VStack(alignment: .leading, spacing: 3) {
            Label {
                Text(entry.locked ? String(localized: "pro.locked") : MetricFormat.value(entry.todayValue, for: entry.metric))
            } icon: {
                Image(systemName: entry.metric.symbol)
            }
            .font(.system(size: 12, weight: .semibold))
            if entry.locked {
                Text("widget.locked").font(.system(size: 11))
            } else {
                WeekHeatmap(style: HeatmapStyle(series: entry.entry.series, scale: entry.entry.settings.scale, palette: .with(id: "neutral")),
                            weeks: 16, end: entry.today, today: nil, fadeLeading: false)
            }
        }
        .widgetAccentable()
    }

    private var circular: some View {
        Gauge(value: min(entry.locked ? 0 : entry.progress, 1)) {
            Image(systemName: entry.metric.symbol)
        } currentValueLabel: {
            if entry.locked {
                Image(systemName: "lock.fill")
            } else {
                Text(MetricFormat.compact(entry.todayValue, for: entry.metric)).minimumScaleFactor(0.5)
            }
        }
        .gaugeStyle(.accessoryCircular)
    }
}
