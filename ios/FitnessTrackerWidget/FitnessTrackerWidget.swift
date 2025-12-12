//
//  FitnessTrackerWidget.swift
//  FitnessTrackerWidget
//
//  Created by Bernat Vidal on 3/12/25.
//

import WidgetKit
import SwiftUI

@available(iOS 16.0, *)
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
        print("FitnessTrackerWidget.Provider: Loading data for timeline...")
        let healthData = WidgetDataManager.loadHealthData()
        let preferences = WidgetDataManager.loadUserPreferences()
        
        print("FitnessTrackerWidget.Provider: Health data loaded: \(healthData != nil ? "✅" : "❌")")
        print("FitnessTrackerWidget.Provider: Preferences loaded: \(preferences != nil ? "✅" : "❌")")
        
        if let healthData = healthData {
            print("FitnessTrackerWidget.Provider: Health data has \(healthData.metrics.count) metrics")
            print("FitnessTrackerWidget.Provider: Metric types: \(Array(healthData.metrics.keys).sorted())")
        }
        
        if let preferences = preferences {
            print("FitnessTrackerWidget.Provider: Preferences has \(preferences.metricConfigs.count) metric configs")
            let enabled = preferences.metricConfigs.values.filter { $0.enabled }
            print("FitnessTrackerWidget.Provider: Enabled metrics: \(enabled.map { $0.metricType }.sorted())")
        }
        
        let selectedMetric = configuration.metricType.rawValue
        print("FitnessTrackerWidget.Provider: Selected metric type: \(selectedMetric)")

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, configuration: configuration, healthData: healthData, preferences: preferences)
            entries.append(entry)
        }

        print("FitnessTrackerWidget.Provider: Generated \(entries.count) timeline entries")
        return Timeline(entries: entries, policy: .atEnd)
    }

//    func relevances() async -> WidgetRelevances<ConfigurationAppIntent> {
//        // Generate a list containing the contexts this widget is relevant in.
//    }
}

@available(iOS 16.0, *)
struct SimpleEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
    let healthData: HealthDataStore?
    let preferences: UserPreferences?
}

@available(iOS 16.0, *)
struct FitnessTrackerWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme
    
    private var enabledMetrics: [MetricConfig] {
        guard let preferences = entry.preferences else { return [] }
        return Array(preferences.metricConfigs.values.filter { $0.enabled })
    }
    
    private var selectedMetricType: String {
        // Get selected metric from configuration (now required, not optional)
        return entry.configuration.metricType.rawValue
    }
    
    private var selectedMetricData: (config: MetricConfig, data: HealthMetricData)? {
        guard let healthData = entry.healthData else {
            return nil
        }
        
        let metricType = selectedMetricType
        
        // Check if the selected metric is enabled
        guard let metricConfig = enabledMetrics.first(where: { $0.metricType == metricType }) else {
            // Selected metric is not enabled, show message
            return nil
        }
        
        guard let metricData = healthData.metrics[metricType] else {
            return nil
        }
        
        return (metricConfig, metricData)
    }
    
    private var mostRecentDataPoint: (point: HealthDataPoint, date: Date)? {
        guard let (_, data) = selectedMetricData else { return nil }
        return data.dataPoints.compactMap { point -> (point: HealthDataPoint, date: Date)? in
            guard let date = point.dateValue else { return nil }
            return (point, date)
        }.sorted(by: { $0.date > $1.date }).first
    }
    
    // Minimum days to show based on widget size
    // ActivityWallView will calculate the actual number of days based on available width
    private var minDays: Int {
        switch family {
        case .systemSmall:
            return 7 // Minimum: Last week
        case .systemMedium:
            return 14 // Minimum: Last 2 weeks
        case .systemLarge:
            return 30 // Minimum: Last month
        default:
            return 7
        }
    }
    
    private var isDarkMode: Bool {
        // Check user preferences for theme first (this is the source of truth from the app)
        if let preferences = entry.preferences {
            switch preferences.theme {
            case "dark":
                return true
            case "light":
                return false
            case "system":
                // For "system", use the actual system color scheme
                return colorScheme == .dark
            default:
                // Default to system if unknown
                return colorScheme == .dark
            }
        }
        
        // If no preferences, use system color scheme as fallback
        return colorScheme == .dark
    }
    
    // MARK: - Theme Colors
    // Matches src/constants/theme.ts - cardBackground color
    
    private var backgroundColor: Color {
        if isDarkMode {
            // Dark mode: #0d1117 - solid color matching app's cardBackground
            return Color(red: 13/255.0, green: 17/255.0, blue: 23/255.0)
        } else {
            // Light mode: #FFFFFF - solid white matching app's cardBackground
            return Color(red: 1.0, green: 1.0, blue: 1.0)
        }
    }
    
    private var primaryTextColor: Color {
        if isDarkMode {
            return Color(red: 1.0, green: 1.0, blue: 1.0) // #FFFFFF
        } else {
            return Color(red: 0.0, green: 0.0, blue: 0.0) // #000000
        }
    }
    
    private var secondaryTextColor: Color {
        if isDarkMode {
            return Color(red: 235/255.0, green: 235/255.0, blue: 245/255.0) // #EBEBF5
        } else {
            return Color(red: 60/255.0, green: 60/255.0, blue: 67/255.0) // #3C3C43
        }
    }
    
    private func getColors(for paletteId: String) -> [String] {
        return WidgetDataManager.getColorsForPalette(paletteId: paletteId, isDarkMode: isDarkMode)
    }
    
    private func calculateActivityWallHeight() -> CGFloat {
        // Height = 7 rows * (cellSize + gap) - gap (last row has no gap after it)
        let cellSize: CGFloat = 11
        let cellGap: CGFloat = 3
        return 7 * (cellSize + cellGap) - cellGap
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let (config, data) = selectedMetricData {
                // Display metric name and current value on same row
                if let mostRecent = mostRecentDataPoint {
                    HStack(alignment: .center) {
                        // Metric name on left
                        Text(config.displayName)
                            .font(.headline)
                            .foregroundColor(primaryTextColor)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        // Value on right
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("\(Int(mostRecent.point.value))")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(primaryTextColor)
                            
                            Text(mostRecent.point.unit)
                                .font(.caption)
                                .foregroundColor(secondaryTextColor)
                        }
                    }
                } else {
                    // Fallback if no recent data point
                    Text(config.displayName)
                        .font(.headline)
                        .foregroundColor(primaryTextColor)
                        .lineLimit(1)
                }
                
                // Activity Wall
                if !data.dataPoints.isEmpty {
                    let colors = getColors(for: config.colorRange.paletteId)
                    GeometryReader { geometry in
                        // Use full available width (geometry already accounts for padding)
                        ActivityWallView(
                            dataPoints: data.dataPoints,
                            thresholds: config.colorRange.thresholds,
                            colors: colors,
                            availableWidth: geometry.size.width,
                            minDays: minDays
                        )
                    }
                    .frame(height: calculateActivityWallHeight())
                    .frame(maxWidth: .infinity, alignment: .trailing)
                } else {
                    Text("No data available")
                        .font(.caption)
                        .foregroundColor(secondaryTextColor)
                        .padding(.top, 2)
                }
                
                // Last sync time (only for larger widgets)
                if family == .systemLarge || family == .systemMedium {
                    if let lastSync = entry.healthData?.lastFullSyncDate {
                        Text("Updated: \(lastSync, style: .relative)")
                            .font(.caption2)
                            .foregroundColor(secondaryTextColor)
                            .padding(.top, 2)
                    }
                }
            } else if let preferences = entry.preferences,
                      let metricConfig = preferences.metricConfigs[selectedMetricType],
                      !metricConfig.enabled {
                // Selected metric is disabled
                VStack(alignment: .leading, spacing: 4) {
                    Text("Metric Disabled")
                        .font(.headline)
                        .foregroundColor(primaryTextColor)
                    Text("The selected metric is disabled in settings. Please enable it or choose another metric.")
                        .font(.caption)
                        .foregroundColor(secondaryTextColor)
                        .lineLimit(3)
                }
            } else if entry.preferences != nil && entry.healthData == nil {
                // Preferences loaded but no health data
                VStack(alignment: .leading, spacing: 4) {
                    Text("No Health Data")
                        .font(.headline)
                        .foregroundColor(primaryTextColor)
                    Text("Sync your health data in the app first.")
                        .font(.caption)
                        .foregroundColor(secondaryTextColor)
                }
            } else if entry.healthData != nil && entry.preferences == nil {
                // Health data loaded but no preferences
                VStack(alignment: .leading, spacing: 4) {
                    Text("No Preferences")
                        .font(.headline)
                        .foregroundColor(primaryTextColor)
                    Text("Open the app to configure settings.")
                        .font(.caption)
                        .foregroundColor(secondaryTextColor)
                }
            } else if entry.healthData != nil || entry.preferences != nil {
                Text("No metrics configured")
                    .font(.caption)
                    .foregroundColor(secondaryTextColor)
            } else {
                // No data at all - check App Group access
                VStack(alignment: .leading, spacing: 4) {
                    Text(WidgetDataManager.isAppGroupAvailable() ? "No Data Available" : "Widget Access Error")
                        .font(.headline)
                        .foregroundColor(primaryTextColor)
                    Text(
                        WidgetDataManager.isAppGroupAvailable()
                            ? "Open the app to sync data and configure settings."
                            : "The widget can't access shared app data. This is usually an App Group entitlement/signing issue in the installed build."
                    )
                        .font(.caption)
                        .foregroundColor(secondaryTextColor)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(backgroundColor)
        .containerBackground(for: .widget) {
            Rectangle()
                .fill(backgroundColor)
        }
    }
}

@available(iOS 17.0, *)
struct FitnessTrackerWidget: Widget {
    let kind: String = "FitnessTrackerWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            FitnessTrackerWidgetEntryView(entry: entry)
        }
        .contentMarginsDisabled()
    }
}

@available(iOS 16.0, *)
extension ConfigurationAppIntent {
    fileprivate static var steps: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.metricType = .steps
        return intent
    }
    
    fileprivate static var calories: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.metricType = .caloriesBurned
        return intent
    }
}

@available(iOS 17.0, *)
#Preview(as: .systemSmall) {
    FitnessTrackerWidget()
} timeline: {
    SimpleEntry(date: .now, configuration: .steps, healthData: nil, preferences: nil)
    SimpleEntry(date: .now, configuration: .calories, healthData: nil, preferences: nil)
}
