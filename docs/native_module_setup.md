# Native Module Setup Guide

## AppGroupStorage Module

The `AppGroupStorage` native module allows the React Native app to share data with the iOS widget via App Groups.

### Files Required

1. `ios/FitnessTracker/AppGroupStorage.swift` - Swift implementation
2. `ios/FitnessTracker/AppGroupStorage.m` - Objective-C bridge

### Verification Steps

1. **Open Xcode Project**
   ```bash
   open ios/FitnessTracker.xcworkspace
   ```

2. **Verify Files Are in Project**
   - In Xcode, check the Project Navigator (left sidebar)
   - Look for `AppGroupStorage.swift` and `AppGroupStorage.m` under the `FitnessTracker` folder
   - If they're missing (shown in red), they need to be added

3. **Add Files to Project (if missing)**
   - Right-click on the `FitnessTracker` folder in Project Navigator
   - Select "Add Files to FitnessTracker..."
   - Navigate to `ios/FitnessTracker/`
   - Select both `AppGroupStorage.swift` and `AppGroupStorage.m`
   - **Important**: Check "Copy items if needed" is UNCHECKED (files are already in the right place)
   - **Important**: Ensure "FitnessTracker" target is checked
   - Click "Add"

4. **Verify Build Phases**
   - Select the `FitnessTracker` target
   - Go to "Build Phases" tab
   - Expand "Compile Sources"
   - Verify both files are listed:
     - `AppGroupStorage.swift`
     - `AppGroupStorage.m`
   - If missing, click "+" and add them

5. **Clean and Rebuild**
   ```bash
   cd ios
   xcodebuild clean -workspace FitnessTracker.xcworkspace -scheme FitnessTracker
   cd ..
   pnpm ios
   ```

### Troubleshooting

**If the module still doesn't load:**

1. Check that the module name matches:
   - Swift: `@objc(AppGroupStorage)`
   - Objective-C: `RCT_EXTERN_MODULE(AppGroupStorage, NSObject)`

2. Verify App Group is configured:
   - Check `ios/FitnessTracker/FitnessTracker.entitlements`
   - Should have: `group.com.fitnesstracker.widgets`
   - Check `ios/FitnessTrackerWidgetExtension.entitlements`
   - Should have the same App Group

3. Rebuild from scratch:
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   pnpm ios
   ```

### Expected Behavior

Once properly set up:
- No "App Group storage not available" warnings
- Migration runs automatically on app startup
- Widget can read data from App Group storage
- Widget displays data instead of "Loading..."

