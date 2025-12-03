//
//  AppIntent.swift
//  FitnessTrackerWidget
//
//  Created by Bernat Vidal on 3/12/25.
//

import WidgetKit
import AppIntents

@available(iOS 16.0, *)
enum MetricTypeAppEnum: String, AppEnum {
    case caloriesBurned = "CALORIES_BURNED"
    case exerciseTime = "EXERCISE_TIME"
    case standingTime = "STANDING_TIME"
    case steps = "STEPS"
    case floorsClimbed = "FLOORS_CLIMBED"
    case sleepHours = "SLEEP_HOURS"
    
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Metric Type"
    
    static var caseDisplayRepresentations: [MetricTypeAppEnum: DisplayRepresentation] {
        [
            .caloriesBurned: DisplayRepresentation(title: "Calories Burned", subtitle: "Active energy burned"),
            .exerciseTime: DisplayRepresentation(title: "Exercise Time", subtitle: "Minutes of exercise"),
            .standingTime: DisplayRepresentation(title: "Standing Time", subtitle: "Hours standing"),
            .steps: DisplayRepresentation(title: "Steps", subtitle: "Daily step count"),
            .floorsClimbed: DisplayRepresentation(title: "Floors Climbed", subtitle: "Floors ascended"),
            .sleepHours: DisplayRepresentation(title: "Hours of Sleep", subtitle: "Sleep duration")
        ]
    }
}

@available(iOS 16.0, *)
struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Fitness Tracker Widget" }
    static var description: IntentDescription { "Display your health metrics with an activity wall." }

    @Parameter(title: "Metric", description: "Select which health metric to display", default: .steps)
    var metricType: MetricTypeAppEnum
    
    static var parameterSummary: some ParameterSummary {
        Summary("Display \(\.$metricType)")
    }
}

