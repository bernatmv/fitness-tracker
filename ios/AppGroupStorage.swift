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
  private static let userDefaults: UserDefaults? = {
    return UserDefaults(suiteName: appGroupIdentifier)
  }()
  
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
    guard let userDefaults = AppGroupStorage.userDefaults else {
      rejecter("STORAGE_ERROR", "App Group UserDefaults not available", nil)
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
    guard let userDefaults = AppGroupStorage.userDefaults else {
      rejecter("STORAGE_ERROR", "App Group UserDefaults not available", nil)
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
    guard let userDefaults = AppGroupStorage.userDefaults else {
      rejecter("STORAGE_ERROR", "App Group UserDefaults not available", nil)
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
    guard let userDefaults = AppGroupStorage.userDefaults else {
      rejecter("STORAGE_ERROR", "App Group UserDefaults not available", nil)
      return
    }
    
    let dictionary = userDefaults.dictionaryRepresentation()
    resolver(Array(dictionary.keys))
  }
  
  /**
   * Clear all items from App Group UserDefaults
   */
  @objc
  func clear(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = AppGroupStorage.userDefaults else {
      rejecter("STORAGE_ERROR", "App Group UserDefaults not available", nil)
      return
    }
    
    let dictionary = userDefaults.dictionaryRepresentation()
    dictionary.keys.forEach { key in
      userDefaults.removeObject(forKey: key)
    }
    userDefaults.synchronize()
    resolver(true)
  }
  
  /**
   * Check if App Group storage is available
   */
  @objc
  func isAvailable(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    resolver(AppGroupStorage.userDefaults != nil)
  }
}

