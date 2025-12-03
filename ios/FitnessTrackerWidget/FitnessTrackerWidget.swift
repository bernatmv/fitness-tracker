//
//  FitnessTrackerWidget.swift
//  FitnessTrackerWidget
//
//  Created by Bernat Vidal on 3/12/25.
//

import WidgetKit
import SwiftUI

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), healthData: nil, preferences: nil)
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        let healthData = WidgetDataManager.loadHealthData()
        let preferences = WidgetDataManager.loadUserPreferences()
        return SimpleEntry(date: Date(), configuration: configuration, healthData: healthData, preferences: preferences)
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
        var entries: [SimpleEntry] = []

        // Load data from App Group storage
        let healthData = WidgetDataManager.loadHealthData()
        let preferences = WidgetDataManager.loadUserPreferences()

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, configuration: configuration, healthData: healthData, preferences: preferences)
            entries.append(entry)
        }

        return Timeline(entries: entries, policy: .atEnd)
    }

//    func relevances() async -> WidgetRelevances<ConfigurationAppIntent> {
//        // Generate a list containing the contexts this widget is relevant in.
//    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
    let healthData: HealthDataStore?
    let preferences: UserPreferences?
}

struct FitnessTrackerWidgetEntryView : View {
    var entry: Provider.Entry
    
    private var enabledMetrics: [MetricConfig] {
        guard let preferences = entry.preferences else { return [] }
        return Array(preferences.metricConfigs.values.filter { $0.enabled })
    }
    
    private var firstMetricData: (config: MetricConfig, data: HealthMetricData)? {
        guard let healthData = entry.healthData,
              let firstMetric = enabledMetrics.first,
              let metricData = healthData.metrics[firstMetric.metricType] else {
            return nil
        }
        return (firstMetric, metricData)
    }
    
    private var mostRecentDataPoint: (point: HealthDataPoint, date: Date)? {
        guard let (_, data) = firstMetricData else { return nil }
        return data.dataPoints.compactMap { point -> (point: HealthDataPoint, date: Date)? in
            guard let date = point.dateValue else { return nil }
            return (point, date)
        }.sorted(by: { $0.date > $1.date }).first
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let (config, _) = firstMetricData {
                // Display metric name
                Text(config.displayName)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                if let mostRecent = mostRecentDataPoint {
                    HStack {
                        Text("\(Int(mostRecent.point.value))")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text(mostRecent.point.unit)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    Text("No data")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Last sync time
                if let lastSync = entry.healthData?.lastFullSyncDate {
                    Text("Updated: \(lastSync, style: .relative)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            } else if entry.healthData != nil || entry.preferences != nil {
                Text("No metrics configured")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                Text("Loading...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
    }
}

struct FitnessTrackerWidget: Widget {
    let kind: String = "FitnessTrackerWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            FitnessTrackerWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
    }
}

extension ConfigurationAppIntent {
    fileprivate static var smiley: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "😀"
        return intent
    }
    
    fileprivate static var starEyes: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "🤩"
        return intent
    }
}

#Preview(as: .systemSmall) {
    FitnessTrackerWidget()
} timeline: {
    SimpleEntry(date: .now, configuration: .smiley, healthData: nil, preferences: nil)
    SimpleEntry(date: .now, configuration: .starEyes, healthData: nil, preferences: nil)
}
