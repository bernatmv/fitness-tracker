import Foundation

/// What the user has unlocked.
enum Access: Codable, Equatable, Sendable {
    /// Calories only.
    case free
    /// Everything, until the trial ends.
    case trial(endsAt: Date)
    /// Lifetime Pro purchase.
    case pro
    /// Bought the app back when it was paid-upfront.
    case legacyPurchase

    func isFullAccess(now: Date = Date()) -> Bool {
        switch self {
        case .free: false
        case .trial(let endsAt): now < endsAt
        case .pro, .legacyPurchase: true
        }
    }

    func canView(_ metric: Metric, now: Date = Date()) -> Bool {
        metric.isFree || isFullAccess(now: now)
    }

    /// Show upgrade prompts only to people who can still buy.
    var showsUpsell: Bool {
        switch self {
        case .free, .trial: true
        case .pro, .legacyPurchase: false
        }
    }
}
