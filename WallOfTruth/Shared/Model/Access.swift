import Foundation

/// What the user has unlocked. The free tier (calories, every feature) is
/// the trial; Pro is a one-time unlock of every metric.
enum Access: String, Codable, Equatable, Sendable {
    /// Calories only.
    case free
    /// Lifetime Pro purchase.
    case pro

    var isFullAccess: Bool { self == .pro }

    func canView(_ metric: Metric) -> Bool {
        metric.isFree || isFullAccess
    }

    /// Show upgrade prompts only to people who can still buy.
    var showsUpsell: Bool { self == .free }

    /// Also reads the keyed format builds before 2.0 cached ({"pro":{}}),
    /// so an upgrade never starts out locked for Pro users or their widgets.
    init(from decoder: Decoder) throws {
        if let raw = try? decoder.singleValueContainer().decode(String.self) {
            self = Access(rawValue: raw) ?? .free
        } else {
            let keys = try decoder.container(keyedBy: AnyKey.self).allKeys
            self = keys.contains { $0.stringValue == Access.pro.rawValue } ? .pro : .free
        }
    }

    private struct AnyKey: CodingKey {
        let stringValue: String
        var intValue: Int? { nil }
        init(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { nil }
    }
}
