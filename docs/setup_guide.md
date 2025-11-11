# Setup Guide

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **PNPM** (v8 or higher)
   ```bash
   npm install -g pnpm
   # Verify: pnpm --version
   ```

3. **Watchman** (for macOS/Linux)
   ```bash
   # macOS
   brew install watchman
   
   # Linux
   # Follow instructions at https://facebook.github.io/watchman/
   ```

### iOS Development (macOS only)

1. **Xcode** (latest version)
   - Install from Mac App Store
   - Install Command Line Tools:
     ```bash
     xcode-select --install
     ```

2. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

### Android Development

1. **Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK (API level 34+)

2. **Java Development Kit** (JDK 17)
   - Install via Android Studio or separately

3. **Environment Variables**
   Add to your `~/.bash_profile` or `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fitness-tracker
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

## Running the App

### iOS

```bash
# Start Metro bundler
pnpm start

# In another terminal, run on iOS
pnpm ios

# Run on specific device
pnpm ios -- --simulator="iPhone 15 Pro"
```

### Android

```bash
# Start Metro bundler
pnpm start

# In another terminal, run on Android
pnpm android

# Run on specific device
adb devices  # List available devices
pnpm android -- --deviceId=<device-id>
```

## Platform-Specific Configuration

### iOS - HealthKit Setup

1. Open `ios/FitnessTracker.xcworkspace` in Xcode

2. Select your project in the navigator

3. Go to "Signing & Capabilities"

4. Add HealthKit capability:
   - Click "+ Capability"
   - Search for "HealthKit"
   - Enable it

5. Update `Info.plist` with health data usage descriptions:
   ```xml
   <key>NSHealthShareUsageDescription</key>
   <string>We need access to your health data to display your fitness activity.</string>
   <key>NSHealthUpdateUsageDescription</key>
   <string>We need access to update your health data.</string>
   ```

6. Enable HealthKit in Background Modes (optional):
   - Add "Background Modes" capability
   - Check "Background fetch"

### Android - Health Connect Setup

1. Open `android/app/src/main/AndroidManifest.xml`

2. Add permissions:
   ```xml
   <uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED"/>
   <uses-permission android:name="android.permission.health.READ_STEPS"/>
   <uses-permission android:name="android.permission.health.READ_EXERCISE"/>
   <uses-permission android:name="android.permission.health.READ_SLEEP"/>
   <uses-permission android:name="android.permission.health.READ_DISTANCE"/>
   <uses-permission android:name="android.permission.health.READ_FLOORS_CLIMBED"/>
   ```

3. Add Health Connect intent filter:
   ```xml
   <activity
     android:name=".MainActivity"
     ...>
     <intent-filter>
       <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
     </intent-filter>
   </activity>
   ```

4. Update `build.gradle`:
   ```gradle
   android {
     compileSdkVersion 34
     ...
   }
   
   dependencies {
     implementation 'androidx.health.connect:connect-client:1.0.0-alpha11'
   }
   ```

## Testing Health Data

### iOS Simulator

The iOS Simulator doesn't provide real health data. For testing:

1. Use a physical iOS device with HealthKit data
2. Or manually add test data in the Health app on the simulator

### Android Emulator

1. Install the Health Connect app on the emulator:
   ```bash
   adb install <path-to-health-connect.apk>
   ```

2. Add test data through the Health Connect app

## Building for Production

### iOS

1. **Configure signing:**
   - Open project in Xcode
   - Select your team in Signing & Capabilities
   - Choose a bundle identifier

2. **Create archive:**
   ```bash
   cd ios
   xcodebuild -workspace FitnessTracker.xcworkspace \
     -scheme FitnessTracker \
     -configuration Release \
     -archivePath ./build/FitnessTracker.xcarchive \
     archive
   ```

3. **Export IPA:**
   - Open Xcode
   - Window > Organizer
   - Select your archive
   - Click "Distribute App"

### Android

1. **Generate signing key:**
   ```bash
   cd android/app
   keytool -genkey -v -keystore fitness-tracker-release.keystore \
     -alias fitness-tracker -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in `android/gradle.properties`:**
   ```properties
   MYAPP_RELEASE_STORE_FILE=fitness-tracker-release.keystore
   MYAPP_RELEASE_KEY_ALIAS=fitness-tracker
   MYAPP_RELEASE_STORE_PASSWORD=*****
   MYAPP_RELEASE_KEY_PASSWORD=*****
   ```

3. **Build release APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Build release AAB (for Play Store):**
   ```bash
   ./gradlew bundleRelease
   ```

Output files:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear cache
pnpm start -- --reset-cache

# Or manually clear
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

### iOS Build Issues

```bash
# Clean build
cd ios
xcodebuild clean
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod deintegrate
pod install
cd ..
```

### Android Build Issues

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Clear gradle cache
rm -rf ~/.gradle/caches/
```

### Dependency Issues

```bash
# Remove node_modules and reinstall
rm -rf node_modules
pnpm install

# iOS: Reinstall pods
cd ios
rm -rf Pods
pod install
cd ..
```

### Common Errors

**Error: "Unable to resolve module"**
- Clear Metro cache: `pnpm start -- --reset-cache`
- Restart Metro bundler

**Error: "No bundle URL present"**
- Make sure Metro is running
- Rebuild the app

**Error: "Command PhaseScriptExecution failed"**
- Check node version: `node --version`
- Reinstall dependencies: `pnpm install`

## Environment Setup for Development

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- React Native Tools
- TypeScript and JavaScript Language Features

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Next Steps

After successful setup:

1. Review the [Development Guide](./development_guide.md)
2. Check the [Implementation Plan](./implementation_plan.md)
3. Run the tests: `pnpm test`
4. Start developing!

## Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review React Native documentation
- Check GitHub issues

