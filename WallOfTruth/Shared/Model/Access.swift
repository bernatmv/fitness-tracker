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
}
