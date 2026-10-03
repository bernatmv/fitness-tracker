import Foundation
import os

/// JSON files in the App Group container shared by the app and the widget.
///
/// Files instead of shared UserDefaults: opening the suite loads all of it
/// into the reading process, which can exceed the widget's ~30MB budget.
enum SharedContainer {
    static let appGroup = "group.com.fitnesstracker.widgets"
    static let log = Logger(subsystem: "com.bernat.wall-of-truth", category: "Storage")

    static var directory: URL {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)
            ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    }

    static func url(_ name: String) -> URL { directory.appendingPathComponent(name) }

    static func read<T: Decodable>(_ type: T.Type, from name: String) -> T? {
        let url = url(name)
        guard let data = try? Data(contentsOf: url) else { return nil }
        do {
            return try decoder.decode(type, from: data)
        } catch {
            log.error("Decoding \(name, privacy: .public) failed: \(error.localizedDescription, privacy: .public)")
            return nil
        }
    }

    static func write<T: Encodable>(_ value: T, to name: String) {
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            try encoder.encode(value).write(to: url(name), options: .atomic)
        } catch {
            log.error("Writing \(name, privacy: .public) failed: \(error.localizedDescription, privacy: .public)")
        }
    }

    static func remove(_ name: String) {
        try? FileManager.default.removeItem(at: url(name))
    }

    private static let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }()

    private static let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()
}

enum FileName {
    static let preferences = "preferences_v2.json"
    static let widgetSnapshot = "widget_snapshot_v2.json"
    static let access = "access_v2.json"
    static func history(_ metric: Metric) -> String { "history_v2_\(metric.rawValue).json" }
}
