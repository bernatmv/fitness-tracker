//
//  WidgetDataManager.swift
//  FitnessTrackerWidget
//
//  Manages reading data from App Group UserDefaults for widget display
//

import Foundation

struct WidgetDataManager {
    private static let appGroupIdentifier = "group.com.fitnesstracker.widgets"
    private static let healthDataKey = "@fitness_tracker:health_data"
    private static let userPreferencesKey = "@fitness_tracker:user_preferences"
    
    static var sharedUserDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroupIdentifier)
    }
    
    /**
     * Load health data from App Group storage
     */
    static func loadHealthData() -> HealthDataStore? {
        guard let userDefaults = sharedUserDefaults,
              let jsonString = userDefaults.string(forKey: healthDataKey),
              let jsonData = jsonString.data(using: .utf8) else {
            return nil
        }
        
        do {
            let decoder = JSONDecoder()
            let healthData = try decoder.decode(HealthDataStore.self, from: jsonData)
            return healthData
        } catch {
            print("Error decoding health data: \(error)")
            return nil
        }
    }
    
    /**
     * Load user preferences from App Group storage
     */
    static func loadUserPreferences() -> UserPreferences? {
        guard let userDefaults = sharedUserDefaults,
              let jsonString = userDefaults.string(forKey: userPreferencesKey),
              let jsonData = jsonString.data(using: .utf8) else {
            return nil
        }
        
        do {
            let decoder = JSONDecoder()
            let preferences = try decoder.decode(UserPreferences.self, from: jsonData)
            return preferences
        } catch {
            print("Error decoding user preferences: \(error)")
            return nil
        }
    }
}

// MARK: - Codable Models for Widget

struct HealthDataStore: Codable {
    let metrics: [String: HealthMetricData]
    let exercises: [ExerciseDetail]
    let lastFullSync: String // ISO8601 date string
    
    var lastFullSyncDate: Date? {
        return WidgetDataManager.parseDate(from: lastFullSync)
    }
}

struct HealthMetricData: Codable {
    let metricType: String
    let unit: String
    let dataPoints: [HealthDataPoint]
    let lastSync: String // ISO8601 date string
    
    var lastSyncDate: Date? {
        return WidgetDataManager.parseDate(from: lastSync)
    }
}

struct HealthDataPoint: Codable {
    let date: String // ISO8601 date string
    let value: Double
    let metricType: String
    let unit: String
    
    var dateValue: Date? {
        return WidgetDataManager.parseDate(from: date)
    }
}

extension WidgetDataManager {
    static func parseDate(from dateString: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateString) {
            return date
        }
        
        // Fallback to standard ISO8601 without fractional seconds
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: dateString)
    }
}

struct ExerciseDetail: Codable {
    let id: String
    let date: String // ISO8601 date string
    let type: String
    let duration: Double
    let caloriesBurned: Double
    let distance: Double?
    let heartRateAverage: Double?
    let heartRateMax: Double?
    let metadata: [String: String]?
    
    var dateValue: Date? {
        return WidgetDataManager.parseDate(from: date)
    }
}

struct UserPreferences: Codable {
    let language: String
    let dateFormat: String
    let theme: String
    let metricConfigs: [String: MetricConfig]
    let widgets: [WidgetConfig]
    let syncConfig: SyncConfig
    let onboardingCompleted: Bool
    let permissionsGranted: Bool
    let enableMultiRowLayout: Bool
}

struct MetricConfig: Codable {
    let metricType: String
    let enabled: Bool
    let colorRange: ColorRange
    let displayName: String
    let iconName: String?
}

struct ColorRange: Codable {
    let thresholds: [Double]
    let paletteId: String
}

struct WidgetConfig: Codable {
    let id: String
    let metricType: String
    let size: String
    let enabled: Bool
}

struct SyncConfig: Codable {
    let strategy: String
    let periodicIntervalMinutes: Int?
    let enableHealthObserver: Bool?
}

