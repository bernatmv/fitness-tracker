import Foundation

/// Decides when to ask for an App Store review: after the app has been used
/// on a few distinct days, at most three times, and never inside Apple's
/// window where a repeat prompt would be dropped anyway.
struct ReviewState: Codable, Equatable {
    static let milestoneDays = 3
    static let minDaysBetweenAsks = 120

    var activeDays: [Day] = []
    var lastAsked: Day?
    var askCount = 0

    func recording(_ today: Day) -> ReviewState {
        guard !activeDays.contains(today) else { return self }
        var copy = self
        copy.activeDays = Array((activeDays + [today]).suffix(Self.milestoneDays))
        return copy
    }

    func shouldAsk(today: Day) -> Bool {
        guard activeDays.count >= Self.milestoneDays, askCount < 3 else { return false }
        if let lastAsked, lastAsked.distance(to: today) < Self.minDaysBetweenAsks { return false }
        return true
    }
}

enum ReviewPrompter {
    private static let key = "review_state_v2"

    /// Returns true when the caller should request a review now. Marks the
    /// ask before returning so a crash mid-prompt never asks twice.
    static func recordLaunchAndCheck(today: Day = .today, defaults: UserDefaults = .standard) -> Bool {
        let stored = defaults.data(forKey: key).flatMap { try? JSONDecoder().decode(ReviewState.self, from: $0) } ?? ReviewState()
        var state = stored.recording(today)
        let ask = state.shouldAsk(today: today)
        if ask {
            state.lastAsked = today
            state.askCount += 1
        }
        defaults.set(try? JSONEncoder().encode(state), forKey: key)
        return ask
    }
}
