import Foundation

/// Everything a widget needs, kept small so the extension decodes it fast.
struct WidgetSnapshot: Codable, Sendable {
    struct Entry: Codable, Equatable, Sendable {
        var settings: MetricSettings
        var series: DaySeries
    }

    /// Enough for the largest widget wall (a bit over a year).
    static let days = 400

    var generatedAt: Date
    var access: Access
    var order: [Metric]
    var entries: [Metric: Entry]

    static func make(preferences: Preferences, histories: [Metric: DaySeries], access: Access, today: Day = .today) -> WidgetSnapshot {
        var entries: [Metric: Entry] = [:]
        for metric in Metric.allCases {
            let series = histories[metric] ?? .empty
            entries[metric] = Entry(
                settings: preferences[metric],
                series: series.suffix(days: days, endingAt: today)
            )
        }
        return WidgetSnapshot(generatedAt: Date(), access: access, order: preferences.orderedMetrics, entries: entries)
    }

    /// Everything except the timestamp, to detect real changes.
    struct Content: Equatable {
        let access: Access
        let order: [Metric]
        let entries: [Metric: Entry]
    }

    var content: Content { Content(access: access, order: order, entries: entries) }

    static func load() -> WidgetSnapshot? {
        SharedContainer.read(WidgetSnapshot.self, from: FileName.widgetSnapshot)
    }

    func save() {
        SharedContainer.write(self, to: FileName.widgetSnapshot)
    }
}
