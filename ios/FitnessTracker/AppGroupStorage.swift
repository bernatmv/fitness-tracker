//
//  AppGroupStorage.swift
//  FitnessTracker
//
//  Created for App Group data sharing between app and widget
//

import Foundation
import React

@objc(AppGroupStorage)
class AppGroupStorage: NSObject, RCTBridgeModule {
  
  private static let appGroupIdentifier = "group.com.fitnesstracker.widgets"
  
  private static func getUserDefaults() -> UserDefaults? {
    return UserDefaults(suiteName: appGroupIdentifier)
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  static func moduleName() -> String! {
    return "AppGroupStorage"
  }
  
  /**
   * Set a string value in App Group UserDefaults
   */
  @objc
  func setItem(_ key: String, value: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = AppGroupStorage.getUserDefaults() else {
      rejecter(
        "STORAGE_ERROR",
        "App Group UserDefaults not available (suite: \(AppGroupStorage.appGroupIdentifier)). " +
          "This usually means the App Group entitlement is missing from the build/provisioning profile.",
        nil
      )
      return
    }
    
    userDefaults.set(value, forKey: key)
    userDefaults.synchronize()
    resolver(true)
  }
  
  /**
   * Get a string value from App Group UserDefaults
   */
  @objc
  func getItem(_ key: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = AppGroupStorage.getUserDefaults() else {
      rejecter(
        "STORAGE_ERROR",
        "App Group UserDefaults not available (suite: \(AppGroupStorage.appGroupIdentifier)). " +
          "This usually means the App Group entitlement is missing from the build/provisioning profile.",
        nil
      )
      return
    }
    
    if let value = userDefaults.string(forKey: key) {
      resolver(value)
    } else {
      resolver(nil)
    }
  }
  
  /**
   * Remove an item from App Group UserDefaults
   */
  @objc
  func removeItem(_ key: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = AppGroupStorage.getUserDefaults() else {
      rejecter(
        "STORAGE_ERROR",
        "App Group UserDefaults not available (suite: \(AppGroupStorage.appGroupIdentifier)). " +
          "This usually means the App Group entitlement is missing from the build/provisioning profile.",
        nil
      )
      return
    }
    
    userDefaults.removeObject(forKey: key)
    userDefaults.synchronize()
    resolver(true)
  }
  
  /**
   * Get all keys from App Group UserDefaults
   */
  @objc
  func getAllKeys(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = AppGroupStorage.getUserDefaults() else {
      rejecter(
        "STORAGE_ERROR",
        "App Group UserDefaults not available (suite: \(AppGroupStorage.appGroupIdentifier)). " +
          "This usually means the App Group entitlement is missing from the build/provisioning profile.",
        nil
      )
      return
    }
    
    let dictionary = userDefaults.dictionaryRepresentation()
    resolver(Array(dictionary.keys))
  }
  
  private static func fileURL(for fileName: String) -> URL? {
    return FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier)?
      .appendingPathComponent(fileName)
  }

  /**
   * Write a file into the App Group container.
   * Files are how the widget reads data: unlike the shared UserDefaults
   * suite (which iOS loads wholesale into the reading process), a file is
   * read individually, keeping the widget's memory footprint small.
   */
  @objc
  func setFile(_ fileName: String, content: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let url = AppGroupStorage.fileURL(for: fileName) else {
      rejecter(
        "STORAGE_ERROR",
        "App Group container not available (suite: \(AppGroupStorage.appGroupIdentifier)). " +
          "This usually means the App Group entitlement is missing from the build/provisioning profile.",
        nil
      )
      return
    }

    do {
      try content.write(to: url, atomically: true, encoding: .utf8)
      resolver(true)
    } catch {
      rejecter("STORAGE_ERROR", "Failed to write file \(fileName): \(error.localizedDescription)", error)
    }
  }

  /**
   * Read a file from the App Group container (resolves nil when missing)
   */
  @objc
  func getFile(_ fileName: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let url = AppGroupStorage.fileURL(for: fileName) else {
      rejecter(
        "STORAGE_ERROR",
        "App Group container not available (suite: \(AppGroupStorage.appGroupIdentifier)).",
        nil
      )
      return
    }

    guard FileManager.default.fileExists(atPath: url.path) else {
      resolver(nil)
      return
    }

    do {
      let content = try String(contentsOf: url, encoding: .utf8)
      resolver(content)
    } catch {
      rejecter("STORAGE_ERROR", "Failed to read file \(fileName): \(error.localizedDescription)", error)
    }
  }

  /**
   * Remove a file from the App Group container (no-op when missing)
   */
  @objc
  func removeFile(_ fileName: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let url = AppGroupStorage.fileURL(for: fileName) else {
      rejecter(
        "STORAGE_ERROR",
        "App Group container not available (suite: \(AppGroupStorage.appGroupIdentifier)).",
        nil
      )
      return
    }

    if FileManager.default.fileExists(atPath: url.path) {
      do {
        try FileManager.default.removeItem(at: url)
      } catch {
        rejecter("STORAGE_ERROR", "Failed to remove file \(fileName): \(error.localizedDescription)", error)
        return
      }
    }
    resolver(true)
  }

  /**
   * Check if App Group storage is available
   */
  @objc
  func isAvailable(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    // UserDefaults(suiteName:) can return nil on-device if entitlements/provisioning are missing,
    // even if things appear to work on the simulator.
    let userDefaultsAvailable = AppGroupStorage.getUserDefaults() != nil
    
    // Extra signal: container URL also depends on the App Group entitlement.
    let containerAvailable =
      FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: AppGroupStorage.appGroupIdentifier
      ) != nil
    
    resolver(userDefaultsAvailable && containerAvailable)
  }
}

