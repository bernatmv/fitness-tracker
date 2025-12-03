//
//  WidgetUpdater.swift
//  FitnessTracker
//
//  React Native bridge for updating widget timelines
//

import Foundation
import WidgetKit
import React

@objc(WidgetUpdater)
class WidgetUpdater: NSObject, RCTBridgeModule {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  static func moduleName() -> String! {
    return "WidgetUpdater"
  }
  
  /**
   * Reload all widget timelines
   */
  @objc
  func reloadAllTimelines(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
      resolver(true)
    } else {
      rejecter("UNSUPPORTED", "Widgets require iOS 14.0 or later", nil)
    }
  }
  
  /**
   * Reload timelines for a specific widget kind
   */
  @objc
  func reloadTimelines(_ kind: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: kind)
      resolver(true)
    } else {
      rejecter("UNSUPPORTED", "Widgets require iOS 14.0 or later", nil)
    }
  }
  
  /**
   * Get available widget kinds
   */
  @objc
  func getAvailableWidgetKinds(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      // WidgetCenter doesn't provide a direct way to get all widget kinds
      // We'll return the known widget kind for this app
      resolver(["FitnessTrackerWidget"])
    } else {
      rejecter("UNSUPPORTED", "Widgets require iOS 14.0 or later", nil)
    }
  }
}

