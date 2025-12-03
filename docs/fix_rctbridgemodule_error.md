# Fixing RCTBridgeModule Conformance Error

## The Problem

Xcode shows: `Type 'AppGroupStorage' does not conform to protocol 'RCTBridgeModule'`

This happens when Swift can't see the `RCTBridgeModule` protocol from React Native.

## Solution

### Step 1: Verify Bridging Header is Configured

1. Open `ios/FitnessTracker.xcworkspace` in Xcode
2. Select the `FitnessTracker` project (blue icon) in Project Navigator
3. Select the `FitnessTracker` target
4. Go to "Build Settings" tab
5. Search for "Swift Compiler - General"
6. Find "Objective-C Bridging Header"
7. It should be set to: `FitnessTracker-Bridging-Header.h` or `$(SRCROOT)/FitnessTracker-Bridging-Header.h`

### Step 2: Verify Bridging Header Content

The file `ios/FitnessTracker-Bridging-Header.h` should contain:

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
```

### Step 3: Clean and Rebuild

1. In Xcode: Product → Clean Build Folder (Shift+Cmd+K)
2. Close Xcode
3. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/FitnessTracker-*
   ```
4. Reopen Xcode and rebuild (Cmd+B)

### Step 4: Verify Files Are in Target

1. Select `AppGroupStorage.swift` in Project Navigator
2. In File Inspector (right panel), check "Target Membership"
3. Ensure `FitnessTracker` is checked
4. Repeat for `AppGroupStorage.m`, `WidgetUpdater.swift`, and `WidgetUpdater.m`

### Step 5: If Still Not Working

If the error persists, try:

1. **Check Module Map**: The React module might not be properly configured. Try:
   - Product → Clean Build Folder
   - Close and reopen Xcode
   - Rebuild

2. **Verify Import**: In the Swift files, ensure:
   ```swift
   import Foundation
   import React
   ```

3. **Check Build Phases**: 
   - Target → Build Phases → Compile Sources
   - All Swift and Objective-C files should be listed

## Alternative: Use Objective-C Instead

If Swift continues to have issues, you can convert the modules to pure Objective-C:

1. Create `AppGroupStorage.m` (Objective-C implementation)
2. Remove `AppGroupStorage.swift`
3. Do the same for `WidgetUpdater`

But the Swift version should work once the bridging header is properly configured.

