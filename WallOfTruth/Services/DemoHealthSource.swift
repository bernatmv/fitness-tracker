import Foundation

/// Deterministic, realistic-looking data for the simulator, previews and
/// App Store screenshots (launch with `-DemoData YES`).
struct DemoHealthSource: HealthSource {
    var isAvailable: Bool { true }

    func requestAuthorization() async throws {}

    func earliestDay() -> Day? { Day.today.advanced(by: -3 * 365) }

    func daily(_ metric: Metric, from: Day, through: Day) async throws -> [Day: Double] {
        if DebugFlags.demoHealth == "empty" { return [:] }
        if DebugFlags.demoHealth == "slow" { try await Task.sleep(for: .seconds(30)) }
        var result: [Day: Double] = [:]
        var day = max(from, earliestDay() ?? from)
        while day <= through {
            result[day] = Self.value(metric, on: day)
            day = day.advanced(by: 1)
        }
        return result
    }

    static func value(_ metric: Metric, on day: Day) -> Double {
        let noise = Self.noise(day.id &* 31 &+ metric.rawValue.count &* 7)
        let weekend = day.weekday == 1 || day.weekday == 7
        // Slow seasonal drift + improving trend makes walls look alive.
        let season = 0.85 + 0.15 * sin(Double(day.id) / 58.0)
        let trend = 0.8 + 0.2 * min(1, Double(day.id - Day.today.id + 720) / 720)
        let rest = noise < 0.07
        var factor = rest ? 0.15 : (0.55 + noise * 0.9) * season * trend * (weekend ? 1.1 : 1)
        // Today is still in progress: some goals are not met yet.
        if day == .today, metric == .calories || metric == .floors { factor = 0.42 }
        switch metric {
        case .calories: return (1050 * factor).rounded()
        case .steps: return (10_500 * factor).rounded()
        case .exercise: return (70 * factor).rounded()
        case .stand: return min(16, (10 * factor).rounded())
        case .floors: return (13 * factor).rounded()
        case .sleep: return rest ? 330 : (360 + 120 * noise * season).rounded()
        }
    }

    private static func noise(_ seed: Int) -> Double {
        var x = UInt64(bitPattern: Int64(seed)) &+ 0x9E37_79B9_7F4A_7C15
        x = (x ^ (x >> 30)) &* 0xBF58_476D_1CE4_E5B9
        x = (x ^ (x >> 27)) &* 0x94D0_49BB_1331_11EB
        x ^= x >> 31
        return Double(x % 10_000) / 10_000
    }
}
