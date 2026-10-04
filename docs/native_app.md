# Native iOS app (SwiftUI)

The app is being rebuilt natively in `WallOfTruth/`, replacing the React Native app in `src/` + `ios/`. It keeps the same bundle IDs, App Group and widget kind, so it ships as an update to the existing App Store app.

## Build and run

```bash
cd WallOfTruth
xcodegen generate          # regenerate WallOfTruth.xcodeproj after editing project.yml
open WallOfTruth.xcodeproj  # Run uses App/WallOfTruth.storekit for local purchases
```

Run the tests with:

```bash
xcodebuild -project WallOfTruth.xcodeproj -scheme WallOfTruth -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test
```

### Debug launch arguments

These only work in Debug builds; see `Services/DebugFlags.swift`.

| Argument | Effect |
| --- | --- |
| `-DemoData YES` | Generated data instead of HealthKit (simulator, screenshots) |
| `-SkipOnboarding YES` | Go straight to the home screen |
| `-Access free\|pro` | Force an access level and skip StoreKit |
| `-Screen paywall\|paywall-steps\|settings\|weeks\|months\|onboarding-health\|detail-STEPS\|detail-STEPS-config\|widgets` | Open a screen on launch. `widgets` is an in-app gallery of every widget layout; add `-Gallery home\|home2` for the marketing layouts. |
| `-Scroll bottom` | Open the home screen scrolled to the last metric |
| `-ResetOnboarding YES` / `-ResetData YES` | Start onboarding again / delete synced history |
| `-DemoHealth empty\|slow` | Demo source returns no data / delays the first sync |

## Structure

| Folder | Contents |
| --- | --- |
| `Shared/Model` | Pure domain types: `Day` (time-zone-proof day index), `Metric`, `ThresholdScale` (the ranges), `DaySeries`, `MetricStats`, `Palette`, `Access`, `Preferences`. Compiled into the app and the widget. |
| `Shared/Design` | Theme tokens (every color, radius and font lives in `Theme.swift`), the heatmaps (`WeekHeatmap`, `MonthBlocksHeatmap`), shared components |
| `Shared/Storage` | JSON files in the App Group container. The widget reads only `widget_snapshot_v2.json`. |
| `Shared/Localization` | One `Localizable.strings` per locale: en, ca, de, es, fr, it, pl |
| `Services` | HealthKit source, sync, background delivery, StoreKit, legacy migration, review prompt |
| `Features` | Screens: Home, Detail, Configure, Settings, Onboarding, Paywall |
| `Widget` | Metric widget (small, medium, large, lock screen) and the Overview widget |
| `Tests` | Swift Testing unit tests for the model and services |

## Visual direction

- **HabitKit:** cards with a metric-tinted top gradient, a 44pt icon tile and a goal badge (progress ring until the goal is met, then a solid check), plus a 30-week wall. Empty days use a 10% tint and today is outlined. A floating glass switcher sits at the bottom.
- **Habit Heatmap:** its month view becomes the **Months** style, where the wall is split into one block per month.
- **Differentiator:** four user-defined ranges per metric, each a deeper shade of the metric color, shown in the walls, the calendar, the Ranges card and the editor. A gold star marks days 50% past the top range.

## Monetization

| Product | ID | Type | Price |
| --- | --- | --- | --- |
| Pro (lifetime) | `com.bernat.walloftruth.pro` | Non-consumable, Family Sharing on | $4.99 |

- **Free:** calories, with every feature. This free tier is the trial; there is no separate trial product.
- **Pro:** a one-time purchase that unlocks the other five metrics and their widgets. There is no subscription.

Conversion levers:

- Locked metrics stay on the home screen with the user's **real** data blurred and an Unlock pill, plus how many days of data are waiting.
- The paywall fans out the user's own locked walls and frames Pro as a one-time payment with no subscription.
- The paywall shows automatically once, right after onboarding, when the first wall is already visible behind it.
- Other entry points are contextual: tapping a locked card, a widget or a settings row opens the paywall with that metric highlighted.

### App Store Connect checklist

1. Create `com.bernat.walloftruth.pro` as a non-consumable priced at $4.99, with Family Sharing on (the paywall promises it). Add a review screenshot of the paywall and attach the product to the release.
2. Set the app price to Free with the release that ships the new build.
3. Archive and upload: `xcodebuild archive` on the `WallOfTruth` scheme (Release), then `xcodebuild -exportArchive -exportOptionsPlist WallOfTruth/ExportOptions.plist -allowProvisioningUpdates`.

## Marketing screenshots

App Store and landing-page images are in [`marketing/`](../marketing/README.md), together with the script that builds them.
