import Foundation

/// Counted strings resolved through Localizable.stringsdict plural rules.
enum Plural {
    static func string(_ key: String, _ count: Int) -> String {
        String.localizedStringWithFormat(NSLocalizedString(key, comment: ""), count)
    }
}
