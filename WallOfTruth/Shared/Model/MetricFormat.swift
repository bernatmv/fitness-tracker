import Foundation

/// Locale-aware value formatting per metric.
enum MetricFormat {
    /// Full value with unit, e.g. "1,204 kcal", "7h 32m".
    static func value(_ value: Double, for metric: Metric, locale: Locale = .current) -> String {
        switch metric {
        case .sleep: duration(minutes: value)
        default: String(format: unitFormat(metric), number(value, for: metric, locale: locale))
        }
    }

    /// Number only, compact for big values, e.g. "12.4K", "7.5".
    static func compact(_ value: Double, for metric: Metric, locale: Locale = .current) -> String {
        switch metric {
        case .sleep: duration(minutes: value)
        case .steps where value >= 10_000:
            value.formatted(.number.notation(.compactName).precision(.fractionLength(0...1)).locale(locale))
        default: number(value, for: metric, locale: locale)
        }
    }

    static func number(_ value: Double, for metric: Metric, locale: Locale = .current) -> String {
        value.formatted(.number.precision(.fractionLength(0)).locale(locale))
    }

    private static func unitFormat(_ metric: Metric) -> String {
        switch metric {
        case .calories: String(localized: "unit.calories")
        case .steps: String(localized: "unit.steps")
        case .exercise: String(localized: "unit.minutes")
        case .stand: String(localized: "unit.hours")
        case .floors: String(localized: "unit.floors")
        case .sleep: "%@"
        }
    }

    private static func duration(minutes: Double) -> String {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = minutes >= 60 ? [.hour, .minute] : [.minute]
        formatter.unitsStyle = .abbreviated
        formatter.zeroFormattingBehavior = minutes >= 1 ? .dropAll : .default
        return formatter.string(from: (minutes.rounded() * 60)) ?? "0m"
    }
}
