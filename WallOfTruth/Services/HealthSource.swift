import Foundation
import HealthKit

/// Daily values for a metric. Abstracted so sync logic is testable and
/// screenshots can run on a simulator without Health data.
protocol HealthSource: Sendable {
    var isAvailable: Bool { get }
    func requestAuthorization() async throws
    func daily(_ metric: Metric, from: Day, through: Day) async throws -> [Day: Double]
    func earliestDay() -> Day?
}

final class HealthKitSource: HealthSource, @unchecked Sendable {
    let store = HKHealthStore()

    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    static let readTypes: Set<HKObjectType> = [
        HKQuantityType(.activeEnergyBurned),
        HKQuantityType(.stepCount),
        HKQuantityType(.flightsClimbed),
        HKQuantityType(.appleExerciseTime),
        HKCategoryType(.appleStandHour),
        HKCategoryType(.sleepAnalysis),
    ]

    func requestAuthorization() async throws {
        try await store.requestAuthorization(toShare: [], read: Self.readTypes)
    }

    func earliestDay() -> Day? {
        Day(store.earliestPermittedSampleDate())
    }

    func daily(_ metric: Metric, from: Day, through: Day) async throws -> [Day: Double] {
        switch metric {
        case .calories: try await sum(.activeEnergyBurned, unit: .kilocalorie(), from: from, through: through)
        case .steps: try await sum(.stepCount, unit: .count(), from: from, through: through)
        case .floors: try await sum(.flightsClimbed, unit: .count(), from: from, through: through)
        case .exercise: try await sum(.appleExerciseTime, unit: .minute(), from: from, through: through)
        case .stand: try await standHours(from: from, through: through)
        case .sleep: try await sleepMinutes(from: from, through: through)
        }
    }

    /// Daily sums via statistics buckets anchored at local midnight.
    private func sum(_ id: HKQuantityTypeIdentifier, unit: HKUnit, from: Day, through: Day) async throws -> [Day: Double] {
        let start = from.date()
        let end = through.advanced(by: 1).date()
        let descriptor = HKStatisticsCollectionQueryDescriptor(
            predicate: .quantitySample(type: HKQuantityType(id), predicate: HKQuery.predicateForSamples(withStart: start, end: end)),
            options: .cumulativeSum,
            anchorDate: start,
            intervalComponents: DateComponents(day: 1)
        )
        let collection = try await descriptor.result(for: store)
        var result: [Day: Double] = [:]
        // `to` includes the bucket starting there; stop just before it.
        collection.enumerateStatistics(from: start, to: end.addingTimeInterval(-1)) { statistics, _ in
            if let value = statistics.sumQuantity()?.doubleValue(for: unit), value > 0 {
                result[Day(statistics.startDate)] = value
            }
        }
        return result
    }

    /// Apple-ring stand hours: hours the watch marked as "stood".
    private func standHours(from: Day, through: Day) async throws -> [Day: Double] {
        let predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: from.date(), end: through.advanced(by: 1).date()),
            HKQuery.predicateForCategorySamples(with: .equalTo, value: HKCategoryValueAppleStandHour.stood.rawValue),
        ])
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: HKCategoryType(.appleStandHour), predicate: predicate)],
            sortDescriptors: []
        )
        return StandHours.perDay(try await descriptor.result(for: store).map(\.startDate))
    }

    private func sleepMinutes(from: Day, through: Day) async throws -> [Day: Double] {
        // Start a day early: a night credited to `from` begins the evening before.
        let predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: from.advanced(by: -1).date(), end: through.advanced(by: 1).date()),
            NSCompoundPredicate(orPredicateWithSubpredicates: HKCategoryValueSleepAnalysis.allAsleepValues.map {
                HKQuery.predicateForCategorySamples(with: .equalTo, value: $0.rawValue)
            }),
        ])
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: HKCategoryType(.sleepAnalysis), predicate: predicate)],
            sortDescriptors: []
        )
        let intervals = try await descriptor.result(for: store).map { DateInterval(start: $0.startDate, end: $0.endDate) }
        return SleepAggregator.minutesPerDay(intervals).filter { $0.key >= from && $0.key <= through }
    }
}
