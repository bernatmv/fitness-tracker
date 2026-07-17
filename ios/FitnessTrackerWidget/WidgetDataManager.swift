//
//  WidgetDataManager.swift
//  FitnessTrackerWidget
//
//  Manages reading widget data FILES from the App Group container.
//
//  IMPORTANT: the widget must never open the shared UserDefaults suite
//  (UserDefaults(suiteName:)). iOS loads the ENTIRE suite into the reading
//  process, and the app stores its full multi-year health store there —
//  that alone can blow the widget's ~30MB memory cap and get the extension
//  killed mid-timeline (the widget then sticks on its redacted placeholder).
//  The app mirrors a trimmed payload + preferences into small JSON files.
//

import Foundation
import os

@available(iOS 14.0, *)
struct WidgetDataManager {
    private static let appGroupIdentifier = "group.com.fitnesstracker.widgets"
    // Keep these names in sync with src/services/widget/widget_payload.ts
    private static let widgetDataFileName = "widget_data.json"
    private static let widgetPreferencesFileName = "widget_preferences.json"

    static let log = Logger(
        subsystem: "com.bernat.wall-of-truth.FitnessTrackerWidget",
        category: "WidgetData"
    )

    private static func fileURL(for fileName: String) -> URL? {
        return FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier)?
            .appendingPathComponent(fileName)
    }

    static func isAppGroupAvailable() -> Bool {
        return FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupIdentifier
        ) != nil
    }

    private static func readFile(_ fileName: String) -> String? {
        guard let url = fileURL(for: fileName) else {
            log.error("App Group container unavailable (entitlement/signing issue)")
            return nil
        }
        guard FileManager.default.fileExists(atPath: url.path) else {
            log.info("File \(fileName, privacy: .public) does not exist yet")
            return nil
        }
        do {
            let content = try String(contentsOf: url, encoding: .utf8)
            log.info("Read \(fileName, privacy: .public): \(content.count) chars")
            return content
        } catch {
            log.error("Failed reading \(fileName, privacy: .public): \(error.localizedDescription, privacy: .public)")
            return nil
        }
    }

    /**
     * Load the trimmed health payload from the App Group container file
     */
    static func loadHealthData() -> HealthDataStore? {
        guard let jsonString = readFile(widgetDataFileName) else {
            return nil
        }

        guard let jsonData = jsonString.data(using: .utf8) else {
            log.error("Widget data file is not valid UTF-8")
            return nil
        }

        do {
            let decoder = JSONDecoder()
            let healthData = try decoder.decode(HealthDataStore.self, from: jsonData)
            let totalDataPoints = healthData.metrics.values.reduce(0) { $0 + $1.dataPoints.count }
            log.info("Decoded widget data: \(healthData.metrics.count) metrics, \(totalDataPoints) data points")
            return healthData
        } catch {
            log.error("Failed decoding widget data: \(error.localizedDescription, privacy: .public)")
            return nil
        }
    }

    /**
     * Load user preferences from the App Group container file
     */
    static func loadUserPreferences() -> UserPreferences? {
        guard let jsonString = readFile(widgetPreferencesFileName) else {
            return nil
        }

        guard let jsonData = jsonString.data(using: .utf8) else {
            log.error("Widget preferences file is not valid UTF-8")
            return nil
        }

        do {
            let decoder = JSONDecoder()
            let preferences = try decoder.decode(UserPreferences.self, from: jsonData)
            log.info("Decoded preferences: \(preferences.metricConfigs.count) metric configs")
            return preferences
        } catch {
            log.error("Failed decoding preferences: \(error.localizedDescription, privacy: .public)")
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
#if DEBUG
            print("WidgetDataManager: Warning - Failed to decode exercises array: \(error)")
            print("WidgetDataManager: Using empty exercises array (not critical for widget)")
#endif
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

/// Decodes an element or yields nil instead of failing the parent collection
struct FailableDecodable<T: Codable>: Codable {
    let value: T?

    init(from decoder: Decoder) throws {
        value = try? T(from: decoder)
    }

    func encode(to encoder: Encoder) throws {
        try value?.encode(to: encoder)
    }
}

/// Tolerant by design: the widget only USES `theme` and `metricConfigs`.
/// The app's preferences schema evolves across versions, so decoding must
/// never fail because an unrelated or missing field changed — that would
/// nil the whole preferences object and the widget would show
/// "No Preferences" even though the file exists.
struct UserPreferences: Codable {
    let theme: String
    let metricConfigs: [String: MetricConfig]

    enum CodingKeys: String, CodingKey {
        case theme
        case metricConfigs
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        theme = (try? container.decode(String.self, forKey: .theme)) ?? "system"
        // Per-entry fault isolation: one malformed metric config must not
        // discard the rest.
        let failable =
            (try? container.decode(
                [String: FailableDecodable<MetricConfig>].self,
                forKey: .metricConfigs
            )) ?? [:]
        metricConfigs = failable.compactMapValues { $0.value }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(theme, forKey: .theme)
        try container.encode(metricConfigs, forKey: .metricConfigs)
    }
}

struct MetricConfig: Codable {
    let metricType: String
    let enabled: Bool
    let colorRange: ColorRange
    let displayName: String
    let iconName: String?

    enum CodingKeys: String, CodingKey {
        case metricType
        case enabled
        case colorRange
        case displayName
        case iconName
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        metricType = try container.decode(String.self, forKey: .metricType)
        enabled = (try? container.decode(Bool.self, forKey: .enabled)) ?? true
        displayName =
            (try? container.decode(String.self, forKey: .displayName)) ?? metricType
        colorRange =
            (try? container.decode(ColorRange.self, forKey: .colorRange))
            ?? ColorRange(thresholds: [0, 0, 0, 0, 0], paletteId: "github_green")
        iconName = try? container.decode(String.self, forKey: .iconName)
    }
}

struct ColorRange: Codable {
    let thresholds: [Double]
    let paletteId: String

    init(thresholds: [Double], paletteId: String) {
        self.thresholds = thresholds
        self.paletteId = paletteId
    }

    enum CodingKeys: String, CodingKey {
        case thresholds
        case paletteId
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        thresholds =
            (try? container.decode([Double].self, forKey: .thresholds))
            ?? [0, 0, 0, 0, 0]
        // Legacy configs stored a `colors` array instead of `paletteId`
        paletteId =
            (try? container.decode(String.self, forKey: .paletteId))
            ?? "github_green"
    }
}

