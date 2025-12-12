//
//  WidgetDataManager.swift
//  FitnessTrackerWidget
//
//  Manages reading data from App Group UserDefaults for widget display
//

import Foundation

@available(iOS 10.0, *)
struct WidgetDataManager {
    private static let appGroupIdentifier = "group.com.fitnesstracker.widgets"
    private static let healthDataKey = "@fitness_tracker:health_data"
    private static let userPreferencesKey = "@fitness_tracker:user_preferences"
    
    static var sharedUserDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroupIdentifier)
    }

    static func isAppGroupAvailable() -> Bool {
        // UserDefaults(suiteName:) and containerURL both depend on App Group entitlements.
        let userDefaultsAvailable = sharedUserDefaults != nil
        let containerAvailable =
            FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: appGroupIdentifier
            ) != nil
        return userDefaultsAvailable && containerAvailable
    }
    
    /**
     * Load health data from App Group storage
     */
    static func loadHealthData() -> HealthDataStore? {
        guard let userDefaults = sharedUserDefaults else {
            print("WidgetDataManager: ❌ App Group UserDefaults not available for suite: \(appGroupIdentifier)")
            return nil
        }
        
        print("WidgetDataManager: ✅ App Group UserDefaults available")
        print("WidgetDataManager: Looking for key: \(healthDataKey)")
        
        // Check if key exists
        let allKeys = userDefaults.dictionaryRepresentation().keys
        print("WidgetDataManager: Available keys in App Group: \(Array(allKeys).sorted())")
        
        guard let jsonString = userDefaults.string(forKey: healthDataKey) else {
            print("WidgetDataManager: ❌ No health data found in App Group storage for key: \(healthDataKey)")
            return nil
        }
        
        print("WidgetDataManager: ✅ Found JSON string, length: \(jsonString.count) characters")
        print("WidgetDataManager: JSON preview (first 200 chars): \(String(jsonString.prefix(200)))")
        
        guard let jsonData = jsonString.data(using: .utf8) else {
            print("WidgetDataManager: ❌ Failed to convert JSON string to data")
            return nil
        }
        
        do {
            let decoder = JSONDecoder()
            let healthData = try decoder.decode(HealthDataStore.self, from: jsonData)
            let metricsCount = healthData.metrics.count
            let totalDataPoints = healthData.metrics.values.reduce(0) { $0 + $1.dataPoints.count }
            print("WidgetDataManager: ✅ Successfully loaded health data with \(metricsCount) metrics, \(totalDataPoints) total data points")
            print("WidgetDataManager: Metric types: \(Array(healthData.metrics.keys).sorted())")
            return healthData
        } catch {
            print("WidgetDataManager: ❌ Error decoding health data: \(error)")
            if let decodingError = error as? DecodingError {
                switch decodingError {
                case .keyNotFound(let key, let context):
                    print("WidgetDataManager: Missing key '\(key.stringValue)' in \(context.debugDescription)")
                    print("WidgetDataManager: Coding path: \(context.codingPath.map { $0.stringValue })")
                case .typeMismatch(let type, let context):
                    print("WidgetDataManager: Type mismatch for type \(type) in \(context.debugDescription)")
                    print("WidgetDataManager: Coding path: \(context.codingPath.map { $0.stringValue })")
                case .valueNotFound(let type, let context):
                    print("WidgetDataManager: Value not found for type \(type) in \(context.debugDescription)")
                    print("WidgetDataManager: Coding path: \(context.codingPath.map { $0.stringValue })")
                case .dataCorrupted(let context):
                    print("WidgetDataManager: Data corrupted: \(context.debugDescription)")
                    print("WidgetDataManager: Coding path: \(context.codingPath.map { $0.stringValue })")
                @unknown default:
                    print("WidgetDataManager: Unknown decoding error")
                }
            }
            // Print a sample of the JSON to help debug
            if let jsonObject = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                print("WidgetDataManager: JSON structure - top level keys: \(Array(jsonObject.keys).sorted())")
                if let metrics = jsonObject["metrics"] as? [String: Any] {
                    print("WidgetDataManager: Metrics keys: \(Array(metrics.keys).sorted())")
                }
            }
            return nil
        }
    }
    
    /**
     * Load user preferences from App Group storage
     */
    static func loadUserPreferences() -> UserPreferences? {
        guard let userDefaults = sharedUserDefaults else {
            print("WidgetDataManager: App Group UserDefaults not available")
            return nil
        }
        
        guard let jsonString = userDefaults.string(forKey: userPreferencesKey) else {
            print("WidgetDataManager: No user preferences found in App Group storage")
            return nil
        }
        
        guard let jsonData = jsonString.data(using: .utf8) else {
            print("WidgetDataManager: Failed to convert preferences JSON string to data")
            return nil
        }
        
        do {
            let decoder = JSONDecoder()
            let preferences = try decoder.decode(UserPreferences.self, from: jsonData)
            print("WidgetDataManager: Successfully loaded preferences with \(preferences.metricConfigs.count) metric configs")
            return preferences
        } catch {
            print("WidgetDataManager: Error decoding user preferences: \(error)")
            if let decodingError = error as? DecodingError {
                switch decodingError {
                case .keyNotFound(let key, let context):
                    print("WidgetDataManager: Missing key '\(key.stringValue)' in \(context.debugDescription)")
                case .typeMismatch(let type, let context):
                    print("WidgetDataManager: Type mismatch for type \(type) in \(context.debugDescription)")
                case .valueNotFound(let type, let context):
                    print("WidgetDataManager: Value not found for type \(type) in \(context.debugDescription)")
                case .dataCorrupted(let context):
                    print("WidgetDataManager: Data corrupted: \(context.debugDescription)")
                @unknown default:
                    print("WidgetDataManager: Unknown decoding error")
                }
            }
            return nil
        }
    }
}

// MARK: - Codable Models for Widget

@available(iOS 10.0, *)
struct HealthDataStore: Codable {
    let metrics: [String: HealthMetricData]
    let exercises: [ExerciseDetail]
    let lastFullSync: String // ISO8601 date string
    
    var lastFullSyncDate: Date? {
        return WidgetDataManager.parseDate(from: lastFullSync)
    }
    
    // Custom decoding to handle exercises gracefully
    // If exercises fail to decode, use empty array (exercises aren't critical for widget display)
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        metrics = try container.decode([String: HealthMetricData].self, forKey: .metrics)
        lastFullSync = try container.decode(String.self, forKey: .lastFullSync)
        
        // Decode exercises array - if it fails, use empty array
        do {
            exercises = try container.decode([ExerciseDetail].self, forKey: .exercises)
        } catch {
            print("WidgetDataManager: Warning - Failed to decode exercises array: \(error)")
            print("WidgetDataManager: Using empty exercises array (not critical for widget)")
            exercises = []
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case metrics
        case exercises
        case lastFullSync
    }
}

@available(iOS 10.0, *)
struct HealthMetricData: Codable {
    let metricType: String
    let unit: String
    let dataPoints: [HealthDataPoint]
    let lastSync: String // ISO8601 date string
    
    var lastSyncDate: Date? {
        return WidgetDataManager.parseDate(from: lastSync)
    }
}

@available(iOS 10.0, *)
struct HealthDataPoint: Codable {
    let date: String // ISO8601 date string
    let value: Double
    let metricType: String
    let unit: String
    
    var dateValue: Date? {
        return WidgetDataManager.parseDate(from: date)
    }
}

@available(iOS 10.0, *)
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
    
    /**
     * Get colors for a palette ID based on theme mode
     */
    static func getColorsForPalette(paletteId: String, isDarkMode: Bool) -> [String] {
        let mode = isDarkMode ? "dark" : "light"
        return ColorPalettes.getColors(for: paletteId, mode: mode)
    }
}

// MARK: - Color Palettes

struct ColorPalettes {
    static func getColors(for paletteId: String, mode: String) -> [String] {
        // Map of palette IDs to color arrays (matching color_palettes.ts)
        let palettes: [String: [String: [String]]] = [
            "github_green": [
                "light": ["#eff2f5", "#aceebb", "#4ac26b", "#2da44e", "#116329"],
                "dark": ["#151b23", "#033a16", "#196c2e", "#2ea043", "#56d364"]
            ],
            "ios_health_red": [
                "light": ["#eff2f5", "#f9b8b2", "#f9827c", "#e74c3c", "#c0392b"],
                "dark": ["#151b23", "#c0392b", "#e74c3c", "#f9827c", "#f9b8b2"]
            ],
            "ios_health_green": [
                "light": ["#eff2f5", "#bdf6d8", "#7cefa1", "#34c759", "#1eae4a"],
                "dark": ["#151b23", "#1eae4a", "#34c759", "#7cefa1", "#bdf6d8"]
            ],
            "ios_health_blue": [
                "light": ["#eff2f5", "#b3dbf7", "#6ec1f6", "#007aff", "#004a99"],
                "dark": ["#151b23", "#004a99", "#007aff", "#6ec1f6", "#b3dbf7"]
            ],
            "ios_health_purple": [
                "light": ["#eff2f5", "#d1b3ff", "#a580e8", "#8e44ad", "#5e3370"],
                "dark": ["#151b23", "#5e3370", "#8e44ad", "#a580e8", "#d1b3ff"]
            ],
            "ocean_blue": [
                "light": ["#eff2f5", "#b3e5fc", "#4fc3f7", "#0288d1", "#01579b"],
                "dark": ["#151b23", "#01579b", "#0288d1", "#4fc3f7", "#b3e5fc"]
            ],
            "sunset_orange": [
                "light": ["#eff2f5", "#ffe0b2", "#ffb74d", "#ff9800", "#e65100"],
                "dark": ["#151b23", "#e65100", "#ff9800", "#ffb74d", "#ffe0b2"]
            ],
            "lavender_purple": [
                "light": ["#eff2f5", "#e1bee7", "#ba68c8", "#9c27b0", "#6a1b9a"],
                "dark": ["#151b23", "#6a1b9a", "#9c27b0", "#ba68c8", "#e1bee7"]
            ],
            "monochrome_gray": [
                "light": ["#eff2f5", "#e0e0e0", "#9e9e9e", "#616161", "#212121"],
                "dark": ["#151b23", "#212121", "#616161", "#9e9e9e", "#e0e0e0"]
            ],
            "fire_red": [
                "light": ["#eff2f5", "#ffcdd2", "#ef5350", "#d32f2f", "#b71c1c"],
                "dark": ["#151b23", "#b71c1c", "#d32f2f", "#ef5350", "#ffcdd2"]
            ],
            "tropical_teal": [
                "light": ["#eff2f5", "#b2ebf2", "#26c6da", "#00acc1", "#00838f"],
                "dark": ["#151b23", "#00838f", "#00acc1", "#26c6da", "#b2ebf2"]
            ],
            "amber_gold": [
                "light": ["#eff2f5", "#ffecb3", "#ffc107", "#ffa000", "#ff6f00"],
                "dark": ["#151b23", "#ff6f00", "#ffa000", "#ffc107", "#ffecb3"]
            ],
            "deep_purple": [
                "light": ["#eff2f5", "#d1c4e9", "#9575cd", "#673ab7", "#4527a0"],
                "dark": ["#151b23", "#4527a0", "#673ab7", "#9575cd", "#d1c4e9"]
            ],
            "rose_pink": [
                "light": ["#eff2f5", "#f8bbd0", "#f48fb1", "#e91e63", "#c2185b"],
                "dark": ["#151b23", "#c2185b", "#e91e63", "#f48fb1", "#f8bbd0"]
            ],
            "cyan_blue": [
                "light": ["#eff2f5", "#b2ebf2", "#4dd0e1", "#00bcd4", "#0097a7"],
                "dark": ["#151b23", "#0097a7", "#00bcd4", "#4dd0e1", "#b2ebf2"]
            ],
            "indigo_night": [
                "light": ["#eff2f5", "#c5cae9", "#7986cb", "#3f51b5", "#283593"],
                "dark": ["#151b23", "#283593", "#3f51b5", "#7986cb", "#c5cae9"]
            ],
            "lime_green": [
                "light": ["#eff2f5", "#dcedc8", "#aed581", "#8bc34a", "#689f38"],
                "dark": ["#151b23", "#689f38", "#8bc34a", "#aed581", "#dcedc8"]
            ]
        ]
        
        // Default to github_green if palette not found
        let palette = palettes[paletteId] ?? palettes["github_green"] ?? [:]
        return palette[mode] ?? palette["light"] ?? ["#eff2f5", "#aceebb", "#4ac26b", "#2da44e", "#116329"]
    }
}

@available(iOS 10.0, *)
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
    
    // Custom decoding to handle missing fields gracefully
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        date = try container.decode(String.self, forKey: .date)
        // type might be missing, use empty string as fallback
        type = try container.decodeIfPresent(String.self, forKey: .type) ?? ""
        // duration might be missing or null, default to 0
        duration = try container.decodeIfPresent(Double.self, forKey: .duration) ?? 0.0
        // caloriesBurned might be missing, default to 0
        caloriesBurned = try container.decodeIfPresent(Double.self, forKey: .caloriesBurned) ?? 0.0
        distance = try container.decodeIfPresent(Double.self, forKey: .distance)
        heartRateAverage = try container.decodeIfPresent(Double.self, forKey: .heartRateAverage)
        heartRateMax = try container.decodeIfPresent(Double.self, forKey: .heartRateMax)
        metadata = try container.decodeIfPresent([String: String].self, forKey: .metadata)
    }
    
    var dateValue: Date? {
        return WidgetDataManager.parseDate(from: date)
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case date
        case type
        case duration
        case caloriesBurned
        case distance
        case heartRateAverage
        case heartRateMax
        case metadata
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

