# Quick Start Guide

Get the Fitness Tracker app running in 5 minutes!

## Prerequisites

- Node.js v18+
- PNPM installed (`npm install -g pnpm`)
- Xcode (for iOS, macOS only)
- Android Studio (for Android)

## Installation

```bash
# 1. Install dependencies
pnpm install

# 2. iOS only - Install pods (macOS only)
# Note: Set LANG environment variable if you encounter encoding issues
export LANG=en_US.UTF-8
cd ios && pod install && cd ..

# 3. Start Metro bundler
pnpm start
```

## Run the App

### iOS (macOS only)

```bash
pnpm ios
```

### Android

```bash
pnpm android
```

## What You'll See

1. **Welcome Screen** - Introduction to the app
2. **Permissions Screen** - Request health data access
3. **Home Screen** - Dashboard with metric cards

## First Time Setup

### iOS

1. Grant HealthKit permissions when prompted
2. App will sync your health data
3. Activity walls will populate with your data

### Android

1. Make sure Health Connect is installed
2. Grant permissions when prompted
3. App will sync your data

## Testing Without Real Data

The app works without health data! You can:

- Navigate all screens
- Configure metrics
- See the UI components
- Test the sync functionality

## Common Issues

**"Cannot find module"**

```bash
pnpm install
pnpm start -- --reset-cache
```

**iOS build fails**

```bash
# Clean and reinstall pods
export LANG=en_US.UTF-8
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

**Icons not appearing**

The app uses `react-native-vector-icons` which requires:
- iOS: Fonts configured in `Info.plist` (already set up)
- Android: Fonts configured in `build.gradle` (already set up)
- After setup, rebuild the app

**Android build fails**

```bash
cd android
./gradlew clean
cd ..
```

## Next Steps

- Read the [Full Documentation](./README.md)
- Check [Setup Guide](./docs/setup_guide.md) for detailed instructions
- Review [Development Guide](./docs/development_guide.md) for coding guidelines

## Key Features to Try

1. **Pull to refresh** - Sync your health data
2. **Tap a metric card** - View detailed statistics
3. **Settings** - Configure metrics, theme, and preferences
4. **Metric details** - Change date ranges
5. **Configure metrics** - Customize colors and thresholds with the built-in color picker
6. **Theme switching** - Switch between light and dark mode in settings

## Development Commands

```bash
pnpm test           # Run tests
pnpm lint          # Check code quality
pnpm format        # Format code
pnpm type-check    # Check TypeScript
```

## Need Help?

- Check the [Setup Guide](./docs/setup_guide.md)
- Review [Troubleshooting](./docs/setup_guide.md#troubleshooting)
- See [Project Summary](./docs/project_summary.md)

Happy tracking! 💪
