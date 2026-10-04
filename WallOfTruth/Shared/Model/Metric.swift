import Foundation

/// Health metrics the wall can show. Raw values match the React Native
/// app and the existing widget intent so saved settings and placed widgets
/// survive the native rewrite.
enum Metric: String, CaseIterable, Codable, Identifiable, Sendable, CodingKeyRepresentable {
    case calories = "CALORIES_BURNED"
    case steps = "STEPS"
    case exercise = "EXERCISE_TIME"
    case stand = "STANDING_TIME"
    case floors = "FLOORS_CLIMBED"
    case sleep = "SLEEP_HOURS"

    var id: String { rawValue }

    /// The metric every user gets for free; the rest are Pro.
    static let free: Metric = .calories

    var isFree: Bool { self == Metric.free }

    var titleKey: String {
        switch self {
        case .calories: "metric.calories"
        case .steps: "metric.steps"
        case .exercise: "metric.exercise"
        case .stand: "metric.stand"
        case .floors: "metric.floors"
        case .sleep: "metric.sleep"
        }
    }

    var title: String { String(localized: String.LocalizationValue(titleKey)) }

    var symbol: String {
        switch self {
        case .calories: "flame.fill"
        case .steps: "figure.walk"
        case .exercise: "figure.run"
        case .stand: "figure.stand"
        case .floors: "figure.stairs"
        case .sleep: "bed.double.fill"
        }
    }

    /// Upper bounds of ranges 1–4. A day below the first value is "not met".
    var defaultThresholds: [Double] {
        switch self {
        case .calories: [700, 850, 1000, 1200]
        case .steps: [3000, 6000, 10000, 15000]
        case .exercise: [30, 60, 100, 150]
        case .stand: [6, 8, 10, 12]
        case .floors: [5, 10, 15, 25]
        case .sleep: [300, 360, 420, 480] // minutes
        }
    }

    var defaultPaletteID: String {
        switch self {
        case .calories: "rose"
        case .steps: "green"
        case .exercise: "lime"
        case .stand: "cyan"
        case .floors: "amber"
        case .sleep: "violet"
        }
    }

    /// Step used by threshold editors.
    var thresholdStep: Double {
        switch self {
        case .calories: 50
        case .steps: 500
        case .exercise: 5
        case .sleep: 15
        case .stand, .floors: 1
        }
    }
}
