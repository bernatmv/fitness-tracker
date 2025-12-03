# Widget Registration Guide

This guide explains how to register widgets so they appear in the widget picker on iOS and Android home screens.

## Overview

Widgets need to be registered at the native platform level:
- **iOS**: Requires a Widget Extension target in Xcode
- **Android**: Requires an AppWidgetProvider registered in AndroidManifest.xml

## iOS Widget Registration

### Step 1: Create Widget Extension in Xcode

1. Open the project in Xcode: `ios/FitnessTracker.xcworkspace`
2. Go to **File > New > Target**
3. Select **Widget Extension**
4. Configure:
   - **Product Name**: `FitnessTrackerWidget`
   - **Organization Identifier**: (your bundle identifier prefix)
   - **Language**: Swift
   - **Include Configuration Intent**: No (for now)
5. Click **Finish** and **Activate** the scheme

### Step 2: Widget Extension Files

The widget extension will be created at:
```
ios/FitnessTrackerWidget/
├── FitnessTrackerWidget.swift
├── FitnessTrackerWidgetBundle.swift
└── Info.plist
```

### Step 3: Configure App Groups (Required for Data Sharing)

1. Select the **FitnessTracker** target
2. Go to **Signing & Capabilities**
3. Click **+ Capability** and add **App Groups**
4. Create/select group: `group.com.fitnesstracker.widgets`
5. Repeat for **FitnessTrackerWidget** target with the same group

### Step 4: Widget Bundle Identifier

The widget extension will automatically be registered with a bundle ID like:
```
com.fitnesstracker.FitnessTrackerWidget
```

iOS will automatically discover and register widgets from extensions with the `.widgetkit-extension` extension point.

## Android Widget Registration

### Step 1: Create Widget Provider

Create the widget provider class (see `android/app/src/main/java/com/fitnesstracker/FitnessTrackerWidgetProvider.kt`)

### Step 2: Create Widget Info XML

Create the widget info file (see `android/app/src/main/res/xml/fitness_tracker_widget_info.xml`)

### Step 3: Register in AndroidManifest.xml

Add the widget receiver to `AndroidManifest.xml`:

```xml
<receiver
    android:name=".FitnessTrackerWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/fitness_tracker_widget_info" />
</receiver>
```

### Step 4: Widget Discovery

Android automatically discovers widgets registered in the manifest. Users can add them by:
1. Long-pressing home screen
2. Selecting "Widgets"
3. Finding "Fitness Tracker"
4. Dragging to home screen

## Testing Widget Registration

### iOS
1. Build and run the app
2. Long-press home screen
3. Tap "+" in top-left
4. Search for "Fitness Tracker"
5. Widget should appear in the list

### Android
1. Build and install the app
2. Long-press home screen
3. Tap "Widgets"
4. Find "Fitness Tracker" widget
5. Drag to home screen

## Troubleshooting

### iOS Widget Not Appearing
- Verify widget extension target is included in build
- Check that App Groups are configured for both targets
- Ensure widget bundle identifier follows pattern: `{main-app-bundle-id}.{widget-name}`
- Check Xcode build logs for widget extension errors

### Android Widget Not Appearing
- Verify receiver is in AndroidManifest.xml
- Check that widget info XML file exists
- Ensure widget provider class extends AppWidgetProvider
- Check logcat for widget-related errors

## Next Steps

After registration, widgets need:
1. Data sharing mechanism (App Groups for iOS, SharedPreferences for Android)
2. React Native bridge to update widget data
3. Widget UI implementation (SwiftUI for iOS, RemoteViews for Android)

See `widget_implementation.md` for implementation details.

