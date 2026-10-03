import Foundation

/// URLs widgets open in the app.
enum DeepLink {
    static func metric(_ metric: Metric) -> URL { URL(string: "walloftruth://metric/\(metric.rawValue)")! }
    static let paywall = URL(string: "walloftruth://pro")!

    enum Target: Equatable { case metric(Metric), paywall }

    static func parse(_ url: URL) -> Target? {
        guard url.scheme == "walloftruth" else { return nil }
        if url.host == "pro" { return .paywall }
        if url.host == "metric", let metric = Metric(rawValue: url.lastPathComponent) { return .metric(metric) }
        return nil
    }
}
