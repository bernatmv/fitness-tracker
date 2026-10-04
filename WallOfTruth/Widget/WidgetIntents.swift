import AppIntents
import WidgetKit

/// Type and case names match the React Native widget so existing widget
/// configurations decode unchanged after the update.
enum MetricTypeAppEnum: String, AppEnum {
    case caloriesBurned = "CALORIES_BURNED"
    case exerciseTime = "EXERCISE_TIME"
    case standingTime = "STANDING_TIME"
    case steps = "STEPS"
    case floorsClimbed = "FLOORS_CLIMBED"
    case sleepHours = "SLEEP_HOURS"

    static var typeDisplayRepresentation: TypeDisplayRepresentation = TypeDisplayRepresentation(name: "widget.metric")

    static var caseDisplayRepresentations: [MetricTypeAppEnum: DisplayRepresentation] = [
        .caloriesBurned: DisplayRepresentation(title: "metric.calories"),
        .steps: DisplayRepresentation(title: "metric.steps"),
        .exerciseTime: DisplayRepresentation(title: "metric.exercise"),
        .standingTime: DisplayRepresentation(title: "metric.stand"),
        .floorsClimbed: DisplayRepresentation(title: "metric.floors"),
        .sleepHours: DisplayRepresentation(title: "metric.sleep"),
    ]

    var metric: Metric { Metric(rawValue: rawValue) ?? .calories }
}

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "widget.title" }
    static var description: IntentDescription { IntentDescription("widget.description") }

    // Same default as the React Native widget, so unconfigured widgets keep their metric.
    @Parameter(title: "widget.metric", default: .steps)
    var metricType: MetricTypeAppEnum

    init() {}
    init(metric: MetricTypeAppEnum) { metricType = metric }
}
