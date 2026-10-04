# Marketing assets

Screenshots of the native app (`WallOfTruth/`) for the App Store and the landing page. The app ran on the iPhone 17 Pro Max simulator with generated demo data, in English, at 9:41. No paywall appears in any image.

| Folder | Contents |
| --- | --- |
| `app-store/iphone-6.9/` | Six captioned App Store screenshots, 1320×2868 (6.9" display; App Store Connect scales them to smaller iPhones) |
| `landing/` | Unframed screens in light and dark, as 660px-wide PNG and full-resolution WebP with rounded corners |
| `widgets/` | Individual widget images with transparent rounded corners, light and dark: small, medium, large and the overview widget |
| `tools/compose.py` | Script that builds all of the above from raw simulator screenshots |

## App Store order

1. **Every day, one square:** home, weeks view (dark)
2. **Your ranges, your colors:** range and color editor (dark)
3. **Month by month:** home, months view (light)
4. **Streaks and history:** metric detail (dark)
5. **Your wall, everywhere:** Home Screen widgets (dark)
6. **Start free with calories:** free home with locked teasers (light)

## Regenerating

Build the debug app, install it on the iPhone 17 Pro Max simulator and capture each screen with launch arguments. For example:

```bash
xcrun simctl launch booted com.bernat.wall-of-truth -DemoData YES -SkipOnboarding YES -Access pro -Screen weeks -AppleLanguages "(en)" -AppleLocale en_US -onboarding_paywall_shown YES
```

`-Screen months|detail-STEPS|detail-STEPS-config|widgets` with `-Gallery home|home2` covers the remaining screens, and `-ResetOnboarding YES` covers onboarding. Then run:

```bash
python3 marketing/tools/compose.py <raw-screenshots-dir> marketing
```

Pass a different language to `-AppleLanguages` to get localized screenshots. The captions in `compose.py` are English only.
