import Foundation
import StoreKit
import os

/// StoreKit 2 purchase of the lifetime Pro unlock. There is no separate
/// trial: the free calories tier, with every feature, is the trial.
@MainActor
@Observable
final class PurchaseManager {
    enum ProductID {
        static let pro = "com.bernat.walloftruth.pro"
    }

    private(set) var access: Access = Access.cached
    private(set) var pro: Product?
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

    /// Localized Pro price, if known.
    var proPrice: String? { pro?.displayPrice ?? DebugFlags.placeholderPrice }

    /// Entitlements first: they work offline, and prompts wait on them.
    func load() async {
        await refreshAccess()
        await loadProducts()
    }

    func loadProducts() async {
        guard DebugFlags.accessOverride == nil, !isLoadingProducts else { return }
        isLoadingProducts = true
        defer { isLoadingProducts = false }
        do {
            pro = try await Product.products(for: [ProductID.pro]).first ?? pro
        } catch {
            log.error("Loading products failed: \(error.localizedDescription, privacy: .public)")
        }
    }

    /// Waits (bounded) until access is definitive. Returns whether it is.
    func waitUntilResolved(timeout: Duration = .seconds(8)) async -> Bool {
        let deadline = ContinuousClock.now + timeout
        while !isResolved, ContinuousClock.now < deadline {
            guard (try? await Task.sleep(for: .milliseconds(200))) != nil else { return false }
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
            isResolved = true
            return set(override)
        }
        var proOwned = false
        for await entitlement in Transaction.currentEntitlements {
            guard case .verified(let transaction) = entitlement, transaction.revocationDate == nil else { continue }
            if transaction.productID == ProductID.pro { proOwned = true }
        }
        guard generation == accessGeneration else { return }
        set(proOwned ? .pro : .free)
        isResolved = true
    }

    func buyPro() async { await purchase(pro) }

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
        message = access.isFullAccess ? .restored : .nothingToRestore
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
        if !new.showsUpsell { awaitingApproval = false }
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
