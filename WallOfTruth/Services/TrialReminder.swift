import Foundation
import UserNotifications

/// A heads-up the day before the trial ends, so nobody is surprised when
/// their walls lock (and the trial feels risk-free to start).
enum TrialReminder {
    static let identifier = "trial-ending"

    static func schedule(endingAt end: Date) async {
        let fireDate = end.addingTimeInterval(-24 * 60 * 60)
        guard fireDate > Date() else { return }
        let center = UNUserNotificationCenter.current()
        guard (try? await center.requestAuthorization(options: [.alert, .sound])) == true else { return }
        let content = UNMutableNotificationContent()
        content.title = String(localized: "trial.reminder.title")
        content.body = String(localized: "trial.reminder.body")
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: fireDate.timeIntervalSinceNow, repeats: false)
        try? await center.add(UNNotificationRequest(identifier: identifier, content: content, trigger: trigger))
    }

    static func cancel() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
    }
}
