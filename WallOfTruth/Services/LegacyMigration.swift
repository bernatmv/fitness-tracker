import Foundation

/// Carries settings over from the React Native app, which kept them as a
/// JSON string in the App Group's UserDefaults.
enum LegacyMigration {
    static let preferencesKey = "@fitness_tracker:user_preferences"

    private struct LegacyPreferences: Decodable {
        struct Config: Decodable {
            struct Range: Decodable {
                let thresholds: [Double]?
                let paletteId: String?
            }
            let enabled: Bool?
            let colorRange: Range?
        }
        let theme: String?
        let onboardingCompleted: Bool?
        let metricConfigs: [String: Config]?
    }

    private static let doneKey = "legacy_migration_done"
    /// Old caches derived from Health; the native app never reads them.
    private static let staleKeys = ["@fitness_tracker:health_data", "@fitness_tracker:widget_data"]

    /// Settings from the old app, at most once per install so a later
    /// problem with the new settings file can never bring old ones back.
    /// Also drops the old multi-MB Health cache from the shared suite.
    static func migrateOnce(
        defaults: UserDefaults? = UserDefaults(suiteName: SharedContainer.appGroup),
        local: UserDefaults = .standard
    ) -> Preferences? {
        guard !local.bool(forKey: doneKey) else { return nil }
        local.set(true, forKey: doneKey)
        staleKeys.forEach { defaults?.removeObject(forKey: $0) }
        guard let json = defaults?.string(forKey: preferencesKey) else { return nil }
        return preferences(fromLegacyJSON: Data(json.utf8))
    }

    static func preferences(fromLegacyJSON data: Data) -> Preferences? {
        guard let legacy = try? JSONDecoder().decode(LegacyPreferences.self, from: data) else { return nil }
        var preferences = Preferences()
        preferences.theme = legacy.theme.flatMap(ThemePreference.init(rawValue:)) ?? .system
        preferences.onboardingCompleted = legacy.onboardingCompleted ?? false
        for (key, config) in legacy.metricConfigs ?? [:] {
            guard let metric = Metric(rawValue: key) else { continue }
            var settings = MetricSettings.defaults(for: metric)
            settings.enabled = config.enabled ?? true
            // Old thresholds were [0, a, b, c, d]; the leading 0 is implicit now.
            if var thresholds = config.colorRange?.thresholds, thresholds.count >= 2 {
                // Very old builds stored sleep in hours; the RN app converted
                // them lazily on load, so some saves still hold hours.
                if metric == .sleep, (thresholds.max() ?? 0) <= 24 { thresholds = thresholds.map { $0 * 60 } }
                settings.thresholds = ThresholdScale(Array(thresholds.dropFirst())).bounds
            }
            if let old = config.colorRange?.paletteId {
                settings.paletteID = Palette.legacyIDs[old] ?? (Palette.all.contains { $0.id == old } ? old : settings.paletteID)
            }
            preferences[metric] = settings
        }
        return preferences
    }
}
