# Widget Setup Steps

Quick reference for setting up widgets on both platforms.

## Android Setup (Complete)

✅ **Files Created:**
- `android/app/src/main/java/com/fitnesstracker/FitnessTrackerWidgetProvider.kt` - Widget provider class
- `android/app/src/main/res/xml/fitness_tracker_widget_info.xml` - Widget configuration
- `android/app/src/main/res/layout/fitness_tracker_widget.xml` - Widget layout
- `android/app/src/main/AndroidManifest.xml` - Updated with widget receiver

**Next Steps:**
1. Build the app: `cd android && ./gradlew assembleDebug`
2. Install on device/emulator
3. Long-press home screen → Widgets → Find "Fitness Tracker"
4. Drag widget to home screen

**Note:** The widget provider currently uses a placeholder layout. Update `FitnessTrackerWidgetProvider.kt` to use `R.layout.fitness_tracker_widget` after building.

## iOS Setup (Manual Steps Required)

### Step 1: Create Widget Extension in Xcode

1. Open `ios/FitnessTracker.xcworkspace` in Xcode
2. **File > New > Target**
3. Select **Widget Extension**
4. Configure:
   - Product Name: `FitnessTrackerWidget`
   - Language: Swift
   - Include Configuration Intent: No
5. Click **Finish** and **Activate** scheme

### Step 2: Configure App Groups

1. Select **FitnessTracker** target
2. **Signing & Capabilities** tab
3. Click **+ Capability** → **App Groups**
4. Add group: `group.com.fitnesstracker.widgets`
5. Repeat for **FitnessTrackerWidget** target

### Step 3: Widget Extension Files

The extension will be created at:
```
ios/FitnessTrackerWidget/
├── FitnessTrackerWidget.swift
├── FitnessTrackerWidgetBundle.swift
└── Info.plist
```

### Step 4: Build and Test

1. Build the app in Xcode
2. Run on device/simulator
3. Long-press home screen → Tap "+"
4. Search for "Fitness Tracker"
5. Widget should appear in list

## Testing Widget Registration

### Verify Android Widget
```bash
# Check if widget is registered
adb shell dumpsys package com.fitnesstracker | grep -A 10 "receiver"
```

### Verify iOS Widget
- Check Xcode build logs for widget extension
- Verify widget appears in widget picker
- Check that App Groups are configured correctly

## Troubleshooting

### Android: Widget Not Appearing
- Ensure `AndroidManifest.xml` has the receiver
- Check that `fitness_tracker_widget_info.xml` exists
- Verify widget provider class compiles
- Check logcat: `adb logcat | grep -i widget`

### iOS: Widget Not Appearing
- Verify widget extension target is included in build
- Check App Groups are configured for both targets
- Ensure widget bundle ID follows pattern: `{main-app-id}.{widget-name}`
- Check Xcode build logs for errors

## Next: Widget Implementation

After registration works, implement:
1. Data sharing (App Groups/SharedPreferences)
2. React Native bridge for updating widgets
3. Widget UI rendering (SwiftUI/RemoteViews)

See `widget_implementation.md` for details.

