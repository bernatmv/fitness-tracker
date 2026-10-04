import Foundation

/// Typed threshold values: numbers in the metric's unit, except sleep,
/// which people think of in hours (stored in minutes).
enum ThresholdInput {
    static func parse(_ text: String, for metric: Metric, locale: Locale = .current) -> Double? {
        let formatter = NumberFormatter()
        formatter.locale = locale
        formatter.numberStyle = .decimal
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        guard let number = formatter.number(from: trimmed)?.doubleValue ?? Double(trimmed), number > 0, number.isFinite else { return nil }
        return metric == .sleep ? (number * 60).rounded() : number.rounded()
    }

    static func editableText(_ value: Double, for metric: Metric, locale: Locale = .current) -> String {
        let number = metric == .sleep ? value / 60 : value
        return number.formatted(.number.precision(.fractionLength(0...2)).grouping(.never).locale(locale))
    }
}
