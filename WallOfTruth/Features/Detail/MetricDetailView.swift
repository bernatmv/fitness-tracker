import SwiftUI

struct MetricDetailView: View {
    let metric: Metric
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var selected: Day?
    @State private var showsConfig = false

    private var settings: MetricSettings { model.preferences[metric] }
    private var series: DaySeries { model.history(metric) }
    private var style: HeatmapStyle { HeatmapStyle(series: series, scale: settings.scale, palette: settings.palette) }
    private var stats: MetricStats {
        MetricStats(series: series, scale: settings.scale, range: Day.today.advanced(by: -364)...Day.today)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                titleBlock
                HistoryWallCard(metric: metric, style: style, selected: $selected)
                chips
                if let selected { SelectedDayCard(metric: metric, day: selected, value: series[selected], settings: settings) }
                MonthCalendarCard(metric: metric, style: style, selected: $selected)
                StatsGrid(metric: metric, stats: stats, palette: settings.palette)
                RangesCard(metric: metric, settings: settings, series: series) { showsConfig = true }
            }
            .padding(.horizontal, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.xxl)
            .animation(.smooth(duration: 0.25), value: selected)
        }
        .scrollIndicators(.hidden)
        .safeAreaInset(edge: .top) { header }
        .screenBackground()
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showsConfig) { MetricConfigView(metric: metric) }
        .task { if DebugFlags.screen?.hasSuffix("-config") == true { showsConfig = true } }
    }

    private var header: some View {
        HStack {
            CircleButton(symbol: "chevron.left", label: "common.back") { dismiss() }
            Spacer()
            CircleButton(symbol: "slider.horizontal.3", label: "config.title") { showsConfig = true }
        }
        .padding(.horizontal, Theme.Spacing.xl)
        .padding(.vertical, Theme.Spacing.s)
        .topBarBackground()
    }

    private var titleBlock: some View {
        HStack(spacing: Theme.Spacing.l) {
            IconTile(metric: metric, palette: settings.palette, size: Theme.Size.headerTile)
            VStack(alignment: .leading, spacing: 3) {
                Text(metric.title).font(.screenTitle).foregroundStyle(Theme.Colors.primaryText)
                Text(String(format: String(localized: "detail.today %@"), MetricFormat.value(series[.today], for: metric)))
                    .font(.cardSubtitle).foregroundStyle(Theme.Colors.secondaryText)
            }
        }
        .padding(.top, Theme.Spacing.s)
    }

    private var chips: some View {
        HStack(spacing: Theme.Spacing.s) {
            Chip(symbol: "flame.fill", text: "\(stats.currentStreak)", color: settings.palette.color)
                .accessibilityLabel(Text(String(format: String(localized: "detail.streak.a11y %lld"), stats.currentStreak)))
            Chip(symbol: "scope", text: "≥ " + MetricFormat.value(settings.scale.goal, for: metric), color: settings.palette.color)
                .accessibilityLabel(Text("detail.goal"))
        }
    }
}

/// What a tapped day was worth and which range it landed in.
private struct SelectedDayCard: View {
    let metric: Metric
    let day: Day
    let value: Double
    let settings: MetricSettings

    var body: some View {
        let level = settings.scale.level(for: value)
        HStack(spacing: Theme.Spacing.m) {
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(settings.palette.color(level: level))
                .frame(width: 22, height: 22)
            VStack(alignment: .leading, spacing: 2) {
                Text(day.date(), format: .dateTime.weekday(.wide).day().month(.wide))
                    .font(.system(size: 13)).foregroundStyle(Theme.Colors.secondaryText)
                Text(MetricFormat.value(value, for: metric)).font(.system(size: 17, weight: .semibold))
            }
            Spacer()
            if settings.scale.isExceptional(value) { StarMark(size: 22) }
            Text(RangeName.text(level)).font(.mono(12, weight: .medium)).foregroundStyle(Theme.Colors.secondaryText)
        }
        .padding(Theme.Spacing.m + 2)
        .surface()
        .transition(.opacity.combined(with: .move(edge: .top)))
    }
}

/// Human name of a range level.
enum RangeName {
    static func text(_ level: Int) -> String {
        switch level {
        case ...0: String(localized: "range.below")
        case 1: String(localized: "range.goal")
        case 2: String(localized: "range.strong")
        case 3: String(localized: "range.great")
        default: String(localized: "range.peak")
        }
    }
}
