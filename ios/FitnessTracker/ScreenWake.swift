//
//  ScreenWake.swift
//  FitnessTracker
//
//  React Native bridge to keep the screen awake during long operations
//  (e.g. the full health-data sync). Without this, iOS auto-locks the
//  screen after the idle timeout and suspends the app mid-sync, so the
//  fetch loop never reaches the save step and no data is persisted.
//

import Foundation
import React
import UIKit

@objc(ScreenWake)
class ScreenWake: NSObject, RCTBridgeModule {

  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  static func moduleName() -> String! {
    return "ScreenWake"
  }

  /**
   * Enable or disable the idle timer. Disabling it prevents the screen from
   * auto-locking, keeping the app foregrounded and active.
   */
  @objc
  func setKeepAwake(_ enabled: Bool, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      UIApplication.shared.isIdleTimerDisabled = enabled
      resolver(true)
    }
  }
}
