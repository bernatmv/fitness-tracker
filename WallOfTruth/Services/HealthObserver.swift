import HealthKit
import os

/// Wakes the app when Health gets new samples (e.g. the watch syncs) so the
/// wall and widgets stay current without opening the app. Must be started
/// at every launch, including background launches.
enum HealthObserver {
    private static let log = Logger(subsystem: "com.bernat.wall-of-truth", category: "Observer")

    private static let types: [HKSampleType] = [
        HKQuantityType(.activeEnergyBurned),
        HKQuantityType(.stepCount),
        HKQuantityType(.flightsClimbed),
        HKQuantityType(.appleExerciseTime),
        HKCategoryType(.appleStandHour),
        HKCategoryType(.sleepAnalysis),
    ]

    static func start(store: HKHealthStore, onChange: @escaping @Sendable () async -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        for type in types {
            let query = HKObserverQuery(sampleType: type, predicate: nil) { _, completion, error in
                if let error {
                    log.error("Observer failed: \(error.localizedDescription, privacy: .public)")
                    completion()
                    return
                }
                Task {
                    await onChange()
                    completion()
                }
            }
            store.execute(query)
            store.enableBackgroundDelivery(for: type, frequency: .hourly) { _, error in
                if let error { log.error("Background delivery failed: \(error.localizedDescription, privacy: .public)") }
            }
        }
    }
}
