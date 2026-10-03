import Foundation

struct MetricSettings: Codable, Equatable, Sendable {
    var enabled: Bool
    var thresholds: [Double]
    var paletteID: String

    static func defaults(for metric: Metric) -> MetricSettings {
        MetricSettings(enabled: true, thresholds: metric.defaultThresholds, paletteID: metric.defaultPaletteID)
    }

    var scale: ThresholdScale { ThresholdScale(thresholds) }
    var palette: Palette { Palette.with(id: paletteID) }
}

enum ThemePreference: String, Codable, CaseIterable, Sendable {
    case system, light, dark
}

/// How the home screen draws each metric.
enum WallStyle: String, Codable, CaseIterable, Sendable {
    /// GitHub-style weeks × weekdays grid.
    case weeks
    /// Calendar month grid.
    case month
}

struct Preferences: Codable, Equatable, Sendable {
    var metrics: [Metric: MetricSettings] = Dictionary(uniqueKeysWithValues: Metric.allCases.map { ($0, .defaults(for: $0)) })
    var order: [Metric] = Metric.allCases
    var theme: ThemePreference = .system
    var wallStyle: WallStyle = .weeks
    var onboardingCompleted = false

    subscript(metric: Metric) -> MetricSettings {
        get { metrics[metric] ?? .defaults(for: metric) }
        set { metrics[metric] = newValue }
    }

    /// Order with any metric missing from older saves appended.
    var orderedMetrics: [Metric] {
        let known = order.filter(Metric.allCases.contains)
        return known + Metric.allCases.filter { !known.contains($0) }
    }

    init() {}

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let fallback = Preferences()
        metrics = (try? c.decode([Metric: MetricSettings].self, forKey: .metrics)) ?? fallback.metrics
        order = (try? c.decode([Metric].self, forKey: .order)) ?? fallback.order
        theme = (try? c.decode(ThemePreference.self, forKey: .theme)) ?? fallback.theme
        wallStyle = (try? c.decode(WallStyle.self, forKey: .wallStyle)) ?? fallback.wallStyle
        onboardingCompleted = (try? c.decode(Bool.self, forKey: .onboardingCompleted)) ?? false
    }
}
