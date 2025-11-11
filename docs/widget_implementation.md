# Widget Implementation Guide

## Overview

This guide outlines how to implement home screen widgets for the Fitness Tracker app on both iOS and Android platforms. Widgets will display activity walls for selected metrics.

## Widget Sizes

### iOS (WidgetKit)
- **Small**: 7 days of activity for one metric
- **Medium**: 14 days of activity for one metric  
- **Large**: 30 days or multiple metrics

### Android (App Widgets)
- **Small (2x2)**: 7 days of activity
- **Medium (4x2)**: 14 days of activity
- **Large (4x4)**: 30 days or multiple metrics

## iOS Widget Implementation

### 1. Create Widget Extension

```bash
# In Xcode
File > New > Target > Widget Extension
```

### 2. Widget Timeline Provider

```swift
// FitnessTrackerWidget.swift
import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), metricData: sampleData)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), metricData: loadMetricData())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        let currentDate = Date()
        
        // Load data from shared UserDefaults
        let metricData = loadMetricDataFromSharedStorage()
        
        // Update every hour
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, metricData: metricData)
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let metricData: MetricData
}
```

### 3. Widget View

```swift
struct FitnessTrackerWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(data: entry.metricData)
        case .systemMedium:
            MediumWidgetView(data: entry.metricData)
        case .systemLarge:
            LargeWidgetView(data: entry.metricData)
        @unknown default:
            Text("Unsupported")
        }
    }
}

struct SmallWidgetView: View {
    let data: MetricData
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(data.metricName)
                .font(.headline)
            
            ActivityGridView(
                dataPoints: data.dataPoints,
                colors: data.colors,
                thresholds: data.thresholds,
                columns: 7
            )
        }
        .padding()
    }
}

struct ActivityGridView: View {
    let dataPoints: [DataPoint]
    let colors: [Color]
    let thresholds: [Double]
    let columns: Int
    
    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: columns), spacing: 2) {
            ForEach(dataPoints) { point in
                Rectangle()
                    .fill(getColor(for: point.value))
                    .frame(width: 10, height: 10)
                    .cornerRadius(2)
            }
        }
    }
    
    func getColor(for value: Double) -> Color {
        // Similar logic to React Native component
        for i in 0..<thresholds.count - 1 {
            if value >= thresholds[i] && value < thresholds[i + 1] {
                return colors[i]
            }
        }
        return colors.last ?? Color.gray
    }
}
```

### 4. Shared Data Storage

```swift
// SharedUserDefaults.swift
class SharedDataManager {
    static let shared = SharedDataManager()
    private let suiteName = "group.com.yourcompany.fitness-tracker"
    
    private lazy var sharedDefaults: UserDefaults? = {
        return UserDefaults(suiteName: suiteName)
    }()
    
    func saveMetricData(_ data: MetricData) {
        guard let sharedDefaults = sharedDefaults else { return }
        
        let encoder = JSONEncoder()
        if let encoded = try? encoder.encode(data) {
            sharedDefaults.set(encoded, forKey: "metricData")
        }
    }
    
    func loadMetricData() -> MetricData? {
        guard let sharedDefaults = sharedDefaults else { return nil }
        
        if let data = sharedDefaults.data(forKey: "metricData") {
            let decoder = JSONDecoder()
            if let decoded = try? decoder.decode(MetricData.self, from: data) {
                return decoded
            }
        }
        return nil
    }
}
```

### 5. React Native Bridge

```typescript
// src/services/widget/widget_service.ios.ts
import { NativeModules } from 'react-native';

const { WidgetManager } = NativeModules;

export const UpdateWidget = async (
  metricType: MetricType,
  dataPoints: HealthDataPoint[]
): Promise<void> => {
  try {
    await WidgetManager.updateWidget({
      metricType,
      dataPoints,
      colors: getColorsForMetric(metricType),
      thresholds: getThresholdsForMetric(metricType),
    });
  } catch (error) {
    console.error('Error updating widget:', error);
  }
};
```

### 6. Widget Configuration

Add to `Info.plist`:
```xml
<key>NSExtension</key>
<dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
</dict>
```

Enable App Groups:
1. Target > Signing & Capabilities
2. Add "App Groups" capability
3. Create group: `group.com.yourcompany.fitness-tracker`

## Android Widget Implementation

### 1. Widget Provider

```kotlin
// FitnessTrackerWidgetProvider.kt
class FitnessTrackerWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val metricData = loadMetricData(context)
        
        val views = RemoteViews(context.packageName, R.layout.fitness_tracker_widget)
        
        // Update widget views
        views.setTextViewText(R.id.widget_title, metricData.metricName)
        
        // Render activity grid
        renderActivityGrid(views, metricData)
        
        // Set up click intent
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun renderActivityGrid(views: RemoteViews, data: MetricData) {
        // Create grid layout programmatically
        val gridLayout = RemoteViews(context.packageName, R.layout.activity_grid)
        
        data.dataPoints.forEachIndexed { index, point ->
            val cellView = RemoteViews(context.packageName, R.layout.activity_cell)
            val color = getColorForValue(point.value, data.thresholds, data.colors)
            cellView.setInt(R.id.cell, "setBackgroundColor", color)
            gridLayout.addView(R.id.grid_container, cellView)
        }
        
        views.addView(R.id.activity_grid, gridLayout)
    }
}
```

### 2. Widget Layout

```xml
<!-- res/layout/fitness_tracker_widget.xml -->
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="8dp"
    android:background="@drawable/widget_background">
    
    <TextView
        android:id="@+id/widget_title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textSize="16sp"
        android:textStyle="bold"
        android:textColor="#000000"/>
    
    <GridLayout
        android:id="@+id/activity_grid"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:columnCount="7"
        android:rowCount="5"/>
</LinearLayout>
```

### 3. Widget Info

```xml
<!-- res/xml/fitness_tracker_widget_info.xml -->
<appwidget-provider
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="3600000"
    android:initialLayout="@layout/fitness_tracker_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:description="@string/widget_description"/>
```

### 4. Manifest Registration

```xml
<!-- AndroidManifest.xml -->
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

### 5. Shared Preferences

```kotlin
// SharedDataManager.kt
class SharedDataManager(private val context: Context) {
    private val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
    
    fun saveMetricData(data: MetricData) {
        val json = Gson().toJson(data)
        prefs.edit().putString("metric_data", json).apply()
    }
    
    fun loadMetricData(): MetricData? {
        val json = prefs.getString("metric_data", null) ?: return null
        return Gson().fromJson(json, MetricData::class.java)
    }
}
```

### 6. React Native Bridge

```java
// WidgetManagerModule.java
public class WidgetManagerModule extends ReactContextBaseJavaModule {
    @ReactMethod
    public void updateWidget(ReadableMap data, Promise promise) {
        try {
            MetricData metricData = parseMetricData(data);
            SharedDataManager manager = new SharedDataManager(getReactApplicationContext());
            manager.saveMetricData(metricData);
            
            // Trigger widget update
            Intent intent = new Intent(getReactApplicationContext(), FitnessTrackerWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            getReactApplicationContext().sendBroadcast(intent);
            
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", e.getMessage());
        }
    }
}
```

## React Native Integration

### Widget Service

```typescript
// src/services/widget/widget_service.ts
import { Platform } from 'react-native';
import { MetricType, HealthDataPoint, MetricConfig } from '@types';

export const UpdateWidgetData = async (
  metricType: MetricType,
  dataPoints: HealthDataPoint[],
  config: MetricConfig
): Promise<void> => {
  if (Platform.OS === 'ios') {
    return UpdateIOSWidget(metricType, dataPoints, config);
  } else {
    return UpdateAndroidWidget(metricType, dataPoints, config);
  }
};

export const RefreshAllWidgets = async (): Promise<void> => {
  // Refresh all active widgets
  const preferences = await LoadUserPreferences();
  
  for (const widget of preferences.widgets) {
    if (widget.enabled) {
      const metricData = await LoadMetricData(widget.metricType);
      if (metricData) {
        await UpdateWidgetData(
          widget.metricType,
          metricData.dataPoints,
          preferences.metricConfigs[widget.metricType]
        );
      }
    }
  }
};
```

### Auto-update on Sync

```typescript
// Update widgets after sync
export const SyncAllMetrics = async (): Promise<HealthDataStore> => {
  const healthDataStore = await performSync();
  
  // Update widgets
  await RefreshAllWidgets();
  
  return healthDataStore;
};
```

## Testing Widgets

### iOS
1. Run app in Xcode
2. Long press home screen
3. Tap "+" to add widget
4. Search for "Fitness Tracker"
5. Select widget size
6. Add to home screen

### Android
1. Build and install APK
2. Long press home screen
3. Tap "Widgets"
4. Find "Fitness Tracker"
5. Drag to home screen

## Widget Update Strategies

### On Data Change
- Update immediately when new data synced
- Provides real-time updates
- May drain battery if frequent

### Periodic Updates
- Update every 1-4 hours
- Balanced approach
- iOS: WidgetKit handles scheduling
- Android: Use AlarmManager or WorkManager

### Hybrid
- Update on app open
- Update periodically in background
- Update on significant data changes

## Best Practices

1. **Keep widgets lightweight**
   - Minimize data processing
   - Use efficient rendering
   - Cache computed values

2. **Handle errors gracefully**
   - Show placeholder on error
   - Don't crash widget
   - Log for debugging

3. **Respect battery**
   - Limit update frequency
   - Use efficient data structures
   - Minimize network calls

4. **Test thoroughly**
   - Test all sizes
   - Test with no data
   - Test with edge cases
   - Test on multiple devices

## Troubleshooting

### iOS
- Widget not updating: Check App Groups configuration
- Data not showing: Verify shared UserDefaults access
- Layout issues: Test on multiple device sizes

### Android
- Widget blank: Check RemoteViews compatibility
- Not appearing: Verify manifest registration
- Layout issues: Test different launcher apps

## Future Enhancements

- Multiple metric widgets
- Widget configuration screen
- Live updates (iOS 16+, Android 12+)
- Interactive widgets
- Complications for Apple Watch
- Wear OS tiles

