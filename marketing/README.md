# Marketing assets

Screenshots of the native app (`WallOfTruth/`) for the App Store and the landing page. The app ran on the iPhone 17 Pro Max simulator with generated demo data, in English, at 9:41. No paywall appears in any image.

| Folder | Contents |
| --- | --- |
| `app-store/iphone-6.9/` | Seven captioned App Store screenshots, 1320×2868 (6.9" display; App Store Connect scales them to smaller iPhones). 01–06 show everything unlocked; 07 is an optional free-tier slide |
| `landing/` | Unframed screens in light and dark, as 660px-wide PNG and full-resolution WebP with rounded corners. All features are unlocked: home (top and scrolled to every metric, weeks and months), a detail screen for each of the six metrics, the ranges editor, widgets and onboarding. `home_free_light` is the only free-tier screen |
| `widgets/` | Individual widget images with transparent rounded corners, light and dark: small, medium, large and the overview widget |
| `tools/compose.py` | Script that builds all of the above from raw simulator screenshots |

## App Store order

1. **Every day, one square:** home, weeks view (dark)
2. **Your ranges, your colors:** range and color editor (dark)
3. **Month by month:** home, months view (light)
4. **Streaks and history:** metric detail (dark)
5. **Your wall, everywhere:** Home Screen widgets (dark)
6. **Six metrics, one wall:** home scrolled to all six metrics, all unlocked (dark)
7. **Start free with calories:** free home with locked teasers (light). This one is optional; skip it for an all-unlocked set.

## Regenerating

Build the debug app, install it on the iPhone 17 Pro Max simulator and capture each screen with launch arguments. For example:

```bash
xcrun simctl launch booted com.bernat.wall-of-truth -DemoData YES -SkipOnboarding YES -Access pro -Screen weeks -AppleLanguages "(en)" -AppleLocale en_US -onboarding_paywall_shown YES
```

The remaining screens use these arguments:

- `-Screen months|detail-<METRIC>|detail-STEPS-config|widgets` (metrics: `CALORIES_BURNED`, `STEPS`, `EXERCISE_TIME`, `STANDING_TIME`, `FLOORS_CLIMBED`, `SLEEP_HOURS`).
- `-Gallery home|home2` for the widget layouts.
- `-Scroll bottom` for the home screen scrolled to the last metric.
- `-ResetOnboarding YES` for onboarding. Then run:

```bash
python3 marketing/tools/compose.py <raw-screenshots-dir> marketing
```

Pass a different language to `-AppleLanguages` to get localized screenshots. The captions in `compose.py` are English only.
