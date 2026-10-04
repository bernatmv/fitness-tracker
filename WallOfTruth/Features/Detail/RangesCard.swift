import SwiftUI

/// The thresholds, shown as a legend with how many of the last 365 days
/// landed in each range. This is what sets the app apart from a plain
/// done/not-done habit tracker, so it gets its own card.
struct RangesCard: View {
    let metric: Metric
    let settings: MetricSettings
    let series: DaySeries
    let edit: () -> Void

    private var counts: [Int] {
        var counts = Array(repeating: 0, count: ThresholdScale.levelCount)
        let today = Day.today
        for offset in 0..<365 {
            let day = today.advanced(by: -offset)
            guard day >= series.start else { break }
            counts[settings.scale.level(for: series[day])] += 1
        }
        return counts
    }

    var body: some View {
        let counts = counts
        let total = max(counts.reduce(0, +), 1)
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            HStack {
                Text("ranges.title").font(.sectionTitle)
                Spacer()
                Button("ranges.edit", action: edit)
                    .font(.scaled(15, weight: .semibold))
                    .foregroundStyle(Theme.Colors.accent)
            }
            .padding(.top, Theme.Spacing.s)
            VStack(spacing: 0) {
                ForEach((0..<ThresholdScale.levelCount).reversed(), id: \.self) { level in
                    row(level: level, count: counts[level], share: Double(counts[level]) / Double(total))
                    if level > 0 { Divider().overlay(Theme.Colors.separator) }
                }
            }
            .padding(.horizontal, Theme.Spacing.l)
            .surface()
            Text("ranges.footer").font(.scaled(12)).foregroundStyle(Theme.Colors.tertiaryText)
        }
    }

    private func row(level: Int, count: Int, share: Double) -> some View {
        HStack(spacing: Theme.Spacing.m) {
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(settings.palette.color(level: level))
                .frame(width: 24, height: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(RangeName.text(level)).font(.scaled(15, weight: .medium))
                Text(span(level)).font(.mono(12)).foregroundStyle(Theme.Colors.secondaryText)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(verbatim: "\(count)").font(.mono(13, weight: .medium))
                Capsule().fill(Theme.Colors.field)
                    .frame(width: 64, height: 4)
                    .overlay(alignment: .leading) {
                        Capsule().fill(settings.palette.color(level: max(level, 1))).frame(width: 64 * share)
                    }
            }
        }
        .padding(.vertical, Theme.Spacing.m)
        .accessibilityElement(children: .combine)
    }

    private func span(_ level: Int) -> String {
        let range = settings.scale.range(of: level)
        guard let upper = range.upper else { return "≥ " + MetricFormat.value(range.lower, for: metric) }
        if level == 0 { return "< " + MetricFormat.value(upper, for: metric) }
        // Unit once, after the upper bound: "10,000 – 15,000 steps".
        let lower = metric == .sleep ? MetricFormat.value(range.lower, for: metric) : MetricFormat.number(range.lower, for: metric)
        return lower + " – " + MetricFormat.value(upper, for: metric)
    }
}
