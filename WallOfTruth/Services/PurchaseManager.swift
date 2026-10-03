import Foundation
import StoreKit
import os

/// StoreKit 2 purchases: a lifetime Pro unlock and a free, time-limited
/// trial (a $0 non-consumable, the pattern App Review guideline 3.1.1
/// allows for non-subscription apps).
@MainActor
@Observable
final class PurchaseManager {
    enum ProductID {
        static let pro = "com.bernat.walloftruth.pro"
        static let trial = "com.bernat.walloftruth.trial7"
    }

    nonisolated static let trialLength: TimeInterval = 7 * 24 * 60 * 60

    private(set) var access: Access = Access.cached
    private(set) var pro: Product?
    private(set) var trial: Product?
    private(set) var trialUsed = false
    /// When the trial ended or ends, if one was ever started.
    private(set) var trialEnd: Date?
    private(set) var isPurchasing = false
    private(set) var isLoadingProducts = false
    /// True once StoreKit has answered at least once this launch.
    private(set) var isResolved = false
    /// Ask to Buy: a purchase waiting for a parent's approval.
    private(set) var awaitingApproval = false
    var message: Message?

    enum Message: Equatable {
        case error(String)
        case restored
        case nothingToRestore
    }

    private var updates: Task<Void, Never>?
    private let log = Logger(subsystem: "com.bernat.wall-of-truth", category: "Store")
    var onAccessChange: ((Access) -> Void)?

    init() {
        // Debug overrides skip StoreKit entirely (it prompts for a sandbox
        // account on simulators).
        guard DebugFlags.accessOverride == nil else { return }
        updates = Task { [weak self] in
            for await update in Transaction.updates {
                if case .verified(let transaction) = update { await transaction.finish() }
                await self?.refreshAccess()
            }
        }
    }

    var canStartTrial: Bool { !trialUsed && (trial != nil || DebugFlags.placeholderPrice != nil) && access == .free }

    /// Localized Pro price, if known.
    var proPrice: String? { pro?.displayPrice ?? DebugFlags.placeholderPrice }

    func load() async {
        await loadProducts()
        await refreshAccess()
    }

    func loadProducts() async {
        guard DebugFlags.accessOverride == nil, !isLoadingProducts else { return }
        isLoadingProducts = true
        defer { isLoadingProducts = false }
        do {
            let products = try await Product.products(for: [ProductID.pro, ProductID.trial])
            pro = products.first { $0.id == ProductID.pro } ?? pro
            trial = products.first { $0.id == ProductID.trial } ?? trial
        } catch {
            log.error("Loading products failed: \(error.localizedDescription, privacy: .public)")
        }
    }

    /// Waits (bounded) until access is definitive. Returns whether it is.
    func waitUntilResolved(timeout: Duration = .seconds(8)) async -> Bool {
        let deadline = ContinuousClock.now + timeout
        while !isResolved, ContinuousClock.now < deadline {
            try? await Task.sleep(for: .milliseconds(200))
        }
        return isResolved
    }

    /// Several refreshes can overlap (updates, purchase, foreground); only
    /// the newest may write its result.
    private var accessGeneration = 0

    func refreshAccess() async {
        accessGeneration += 1
        let generation = accessGeneration
        if let override = DebugFlags.accessOverride {
            if case .trial(let endsAt) = override { trialEnd = endsAt }
            isResolved = true
            return set(override)
        }
        var proOwned = false
        var trialStart: Date?
        for await entitlement in Transaction.currentEntitlements {
            guard case .verified(let transaction) = entitlement, transaction.revocationDate == nil else { continue }
            switch transaction.productID {
            case ProductID.pro: proOwned = true
            case ProductID.trial: trialStart = transaction.purchaseDate
            default: break
            }
        }
        trialUsed = trialStart != nil
        trialEnd = trialStart?.addingTimeInterval(Self.trialLength)
        guard generation == accessGeneration else { return }
        set(Self.resolve(proOwned: proOwned, trialStart: trialStart, now: Date()))
        isResolved = true
    }

    /// Pure resolution so the rules are unit-testable.
    nonisolated static func resolve(proOwned: Bool, trialStart: Date?, now: Date) -> Access {
        if proOwned { return .pro }
        if let trialStart {
            let endsAt = trialStart.addingTimeInterval(trialLength)
            return now < endsAt ? .trial(endsAt: endsAt) : .free
        }
        return .free
    }

    func buyPro() async { await purchase(pro) }

    func startTrial() async {
        await purchase(trial)
        if case .trial(let endsAt) = access { await TrialReminder.schedule(endingAt: endsAt) }
    }

    func restore() async {
        do {
            try await AppStore.sync()
        } catch StoreKitError.userCancelled {
            return
        } catch {
            message = .error(error.localizedDescription)
            return
        }
        await refreshAccess()
        message = access.showsUpsell ? .nothingToRestore : .restored
    }

    private func purchase(_ product: Product?) async {
        guard let product, !isPurchasing else { return }
        isPurchasing = true
        defer { isPurchasing = false }
        do {
            switch try await product.purchase() {
            case .success(let result):
                if case .verified(let transaction) = result { await transaction.finish() }
            case .pending:
                awaitingApproval = true
            case .userCancelled:
                break
            @unknown default:
                break
            }
        } catch {
            message = .error(error.localizedDescription)
        }
        await refreshAccess()
    }

    private func set(_ new: Access) {
        if !new.showsUpsell {
            awaitingApproval = false
            TrialReminder.cancel()
        }
        guard new != access else { return }
        access = new
        new.cache()
        onAccessChange?(new)
    }
}

extension Access {
    /// Last known access, so launch and the widget never flash locked
    /// content for paying users while StoreKit loads.
    static var cached: Access { SharedContainer.read(Access.self, from: FileName.access) ?? .free }
    func cache() { SharedContainer.write(self, to: FileName.access) }
}
