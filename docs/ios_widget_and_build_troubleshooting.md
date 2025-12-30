# iOS Widget + iOS Build Troubleshooting (FitnessTracker)

This document explains a few **recent, easy-to-repeat iOS pitfalls** we hit while working on the widget + iOS build, and the reasoning behind the current setup.

It’s written so a future maintainer (or AI agent) can quickly answer:

- “Why does the widget show no data on TestFlight but works on simulator?”
- “Why did `pod install` suddenly start failing with `object version` errors?”
- “Why did `pnpm ios` / `xcodebuild` fail after adding a widget control?”

---

## Widget shows on device but never loads data (TestFlight)

### Symptom

- Widget can be added on a real device, but it stays empty / never loads shared data.
- Same build logic works on iOS Simulator.

### Root causes we’ve seen (most common → least)

#### 1) App Group entitlement missing in Distribution/TestFlight signing

Even if the **debug/simulator build** works, a **TestFlight (distribution) build** can fail if the App Group entitlement isn’t present in the signed app or the signed widget extension.

**What it looks like at runtime**

- The widget can render its UI, but `UserDefaults(suiteName:)` and/or `FileManager.default.containerURL(forSecurityApplicationGroupIdentifier:)` effectively behaves like there is **no shared container**, so the widget reads “no data”.

**What to check**

- App Group ID used everywhere is: `group.com.fitnesstracker.widgets`
- Entitlements must include that group for **both targets**:
  - Main app entitlements: `ios/FitnessTracker/FitnessTracker.entitlements`
  - Widget extension entitlements: `ios/FitnessTrackerWidgetExtension.entitlements`
- In Apple Developer / signing:
  - Ensure the App Group capability is enabled for both App IDs:
    - `com.bernat.wall-of-truth`
    - `com.bernat.wall-of-truth.FitnessTrackerWidget`

**Why simulator can mislead**

- Simulator often behaves more permissively (or at least differently) around signing/provisioning, and it’s easy to accidentally validate the wrong thing.

#### 2) Widget extension deployment target misconfigured

We found the widget extension target had an invalid/high deployment target at one point.

**Why it matters**

- If the widget extension can’t execute normally on device due to deployment target mismatch, it may appear “created” but never actually runs its data pipeline.

**What to check**

- `ios/FitnessTracker.xcodeproj/project.pbxproj` for the target `FitnessTrackerWidgetExtension`:
  - `IPHONEOS_DEPLOYMENT_TARGET` should align with what the widget code requires (currently the main widget entry uses iOS 17 APIs).

---

## Runtime diagnostics added for App Group availability

### Why

When App Group access fails on device, the widget previously degraded into “no data”, which is ambiguous.

### What we do now

- The native `AppGroupStorage.isAvailable()` checks:
  - `UserDefaults(suiteName:) != nil`
  - `FileManager.default.containerURL(forSecurityApplicationGroupIdentifier:) != nil`
- The widget has a helper:
  - `WidgetDataManager.isAppGroupAvailable()`
- Widget UI shows a more explicit message when the App Group is not available.
- The app Settings screen includes a widget diagnostics panel to quickly validate a TestFlight build.

### How to use the in-app widget diagnostics (TestFlight-friendly)

1. Open the app → **Settings**
2. Scroll to **Widgets**
3. Tap **Widget Diagnostics**
   - If **App Group available = ❌**, this is almost certainly a signing/provisioning/App Group capability problem for the distribution build.
   - If **App Group available = ✅** but **Has health data / Has preferences = ❌**, the widget is running but the expected keys are missing from the shared container.
4. Optionally tap **Refresh Widgets** to request `WidgetKit` to reload timelines immediately.

**Relevant files**

- Native module: `ios/AppGroupStorage.swift` and `ios/FitnessTracker/AppGroupStorage.swift`
- Widget reader: `ios/FitnessTrackerWidget/WidgetDataManager.swift`
- Widget UI: `ios/FitnessTrackerWidget/FitnessTrackerWidget.swift`
- App diagnostics: `src/services/widget/widget_diagnostics.ts` + `src/screens/settings/SettingsScreen.tsx`

---

## `pod install` fails with:

`Unable to find compatibility version string for object version '70'/'71'`

### Symptom

Running `pod install` fails with an error like:

- `ArgumentError - [Xcodeproj] Unable to find compatibility version string for object version '70'`
- or `... object version '71'`

### What it means

This is a **Ruby tooling mismatch**:

- CocoaPods uses the `xcodeproj` Ruby gem to read and write `.pbxproj` files.
- Certain newer Xcode project “objectVersion” values are not recognized by the installed `xcodeproj` gem, causing CocoaPods to crash.

### The important constraint in this repo

Our environment included `xcodeproj` that did **not** recognize `objectVersion = 70` or `71`.

So, for CocoaPods to work reliably, the main project must use an object version the gem understands.

### Current solution

We pin `objectVersion` in the main project to a supported value:

- `ios/FitnessTracker.xcodeproj/project.pbxproj`
  - `objectVersion = 77;`
  - `compatibilityVersion = "Xcode 16.0";`

### Why this can regress

Xcode may rewrite `project.pbxproj` when project settings change, potentially bumping `objectVersion` again.

**If `pod install` fails again**

1. Open `ios/FitnessTracker.xcodeproj/project.pbxproj`
2. Check the top-level:
   - `objectVersion = ...;`
3. If it’s `70` or `71`, change it back to `77` and try `pod install` again.

---

## `pnpm ios` / `xcodebuild` fails after adding a widget control (“ControlWidget”)

### Symptom

`xcodebuild` fails with Swift availability errors mentioning iOS 18, for example:

- `... is only available in iOS 18.0 or newer`
- or AppIntent availability errors.

### Root cause

`ControlWidget` (WidgetKit Control Widgets) is iOS 18+.
If any file using those types is compiled as part of the widget extension target while the target supports iOS < 18, Swift compilation fails.

### Decision in this repo

We **removed the Control Widget entirely** to keep compatibility and simplify the build.

**Removed file**

- `ios/FitnessTrackerWidget/FitnessTrackerWidgetControl.swift`

**Bundle no longer references it**

- `ios/FitnessTrackerWidget/FitnessTrackerWidgetBundle.swift`

### If you want to re-introduce it later

Do so only if you are OK with:

- raising the widget extension’s minimum iOS version to 18, or
- using a separate target / build configuration that only includes it on iOS 18+.

---

## “Liquid glass” / modern iOS bottom navigation styling (React Navigation)

### Context

Bottom navigation is implemented with `@react-navigation/bottom-tabs` and styled via:

- `src/navigation/AppNavigator.tsx`

### Current approach

- Use iOS “material” blur types on newer iOS versions, but keep a fallback for older iOS.
- Keep Android unaffected.

### What to check if the tab bar doesn’t look right

- Ensure `@react-native-community/blur` is installed and linked (it is used for the tab bar background).
- Confirm the blur type used is supported by the iOS version you’re running.

---

## Quick command checklist

- **Pods**

```bash
cd ios
pod install
```

- **Run iOS (avoid Metro terminal window issues)**

```bash
pnpm exec react-native run-ios --no-packager
```

---

## Common “gotchas” summary

- **Widget data missing only on TestFlight**: almost always App Group entitlement/signing mismatch.
- **`pod install` object version crash**: `project.pbxproj` `objectVersion` drifted to an unsupported value.
- **Widget control compile errors**: iOS 18-only widget control code included in an iOS 17 target.
