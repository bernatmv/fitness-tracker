import Foundation

/// Launch-argument switches for simulator runs and screenshots, e.g.
/// `-DemoData YES -Access free -SkipOnboarding YES -Screen paywall`.
/// Compiled out of release builds.
enum DebugFlags {
    static var demoData: Bool { flag("DemoData") }
    static var skipOnboarding: Bool { flag("SkipOnboarding") }
    static var resetOnboarding: Bool { flag("ResetOnboarding") }
    /// Deletes synced history so first-sync states can be reviewed.
    static var resetData: Bool { flag("ResetData") }
    /// `empty` returns no Health data; `slow` delays the first sync.
    static var demoHealth: String? { string("DemoHealth") }
    static var screen: String? { string("Screen") }
    static var gallery: String? { string("Gallery") }
    /// Shown when StoreKit has no products (simulator runs outside Xcode).
    static var placeholderPrice: String? { demoData ? "$4.99" : nil }

    static var accessOverride: Access? {
        switch string("Access") {
        case "free": .free
        case "pro": .pro
        case "trial": .trial(endsAt: Date().addingTimeInterval(2 * 86_400 + 3600))
        default: nil
        }
    }

    private static func flag(_ key: String) -> Bool {
        #if DEBUG
        UserDefaults.standard.bool(forKey: key)
        #else
        false
        #endif
    }

    private static func string(_ key: String) -> String? {
        #if DEBUG
        UserDefaults.standard.string(forKey: key)
        #else
        nil
        #endif
    }
}
