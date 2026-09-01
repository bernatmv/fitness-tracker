//
//  StoreReview.swift
//  FitnessTracker
//
//  React Native bridge to SKStoreReviewController.
//
//  Apple decides whether the prompt is actually shown — it is rate limited to three times a
//  year per user and silently ignored otherwise, which is why this resolves true for
//  "asked", never for "rated". Nothing here can read the rating or whether one was left,
//  and that is deliberate on Apple's part: an app must not be able to gate anything on
//  having been reviewed.
//

import Foundation
import React
import StoreKit
import UIKit

@objc(StoreReview)
class StoreReview: NSObject, RCTBridgeModule {

  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  static func moduleName() -> String! {
    return "StoreReview"
  }

  /**
   * Ask iOS to show the review prompt. Resolves false when no active window scene is
   * available (backgrounded, or mid-transition), so the caller can leave its milestone
   * unspent rather than burning it on a prompt nobody saw.
   */
  @objc
  func requestReview(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard
        let scene = UIApplication.shared.connectedScenes
          .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
      else {
        resolve(false)
        return
      }

      if #available(iOS 14.0, *) {
        SKStoreReviewController.requestReview(in: scene)
      } else {
        SKStoreReviewController.requestReview()
      }
      resolve(true)
    }
  }
}
