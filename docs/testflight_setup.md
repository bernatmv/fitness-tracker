# TestFlight Setup Guide

This guide will help you set up TestFlight to test the Fitness Tracker app on your iPhone.

## Prerequisites

1. **Apple Developer Account** (paid, $99/year)
   - Sign up at [developer.apple.com](https://developer.apple.com)
   - Enroll in the Apple Developer Program

2. **Xcode** (latest version recommended)
   - Available on Mac App Store

3. **Physical iPhone** for testing

## Step 1: Configure App Identifier

### 1.1 Update Bundle Identifier

The current bundle identifier is a placeholder. You need to set a unique one:

1. Open `ios/FitnessTracker.xcodeproj` in Xcode
2. Select the **FitnessTracker** project in the navigator
3. Select the **FitnessTracker** target
4. Go to **Signing & Capabilities** tab
5. Change **Bundle Identifier** from `org.reactjs.native.example.FitnessTracker` to something unique like:
   - `com.yourname.fitness-tracker` (replace `yourname` with your name/company)

### 1.2 Create App ID in Apple Developer Portal

1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (plus button)
4. Select **App IDs** → **Continue**
5. Select **App**
6. Fill in:
   - **Description**: Fitness Tracker
   - **Bundle ID**: Select **Explicit** and enter the same bundle ID you set in Xcode (e.g., `com.yourname.fitness-tracker`)
7. Enable **HealthKit** capability (under Capabilities)
8. Click **Continue** → **Register**

## Step 2: Create App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Fitness Tracker
   - **Primary Language**: English (or your preference)
   - **Bundle ID**: Select the App ID you created
   - **SKU**: A unique identifier (e.g., `fitness-tracker-001`)
   - **User Access**: Full Access (or Limited if you have a team)
4. Click **Create**

## Step 3: Configure Signing in Xcode

1. In Xcode, select the **FitnessTracker** target
2. Go to **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Select your **Team** from the dropdown (your Apple Developer account)
5. Xcode will automatically:
   - Create/update provisioning profiles
   - Configure signing certificates

## Step 4: Update Version and Build Number

1. In Xcode, select the **FitnessTracker** target
2. Go to **General** tab
3. Update:
   - **Version**: `1.0` (or increment as needed)
   - **Build**: `1` (increment this for each TestFlight upload)

## Step 5: Build Archive for TestFlight

### 5.1 Clean Build

```bash
cd ios
xcodebuild clean -workspace FitnessTracker.xcworkspace -scheme FitnessTracker
cd ..
```

### 5.2 Create Release Build

1. Open `ios/FitnessTracker.xcworkspace` in Xcode (not `.xcodeproj`)
2. Select **Any iOS Device** or **Generic iOS Device** from the device selector (top toolbar)
3. Go to **Product** → **Archive**
4. Wait for the archive to complete (this may take several minutes)

### 5.3 Alternative: Build from Command Line

```bash
cd ios
xcodebuild -workspace FitnessTracker.xcworkspace \
  -scheme FitnessTracker \
  -configuration Release \
  -archivePath build/FitnessTracker.xcarchive \
  archive
```

## Step 6: Upload to App Store Connect

### Option A: Using Xcode Organizer (Recommended)

1. After archiving, Xcode will open the **Organizer** window
2. Select your archive
3. Click **Distribute App**
4. Select **App Store Connect**
5. Click **Next**
6. Select **Upload**
7. Click **Next**
8. Review options:
   - ✅ **Include bitcode** (if available)
   - ✅ **Upload your app's symbols** (for crash reports)
9. Click **Upload**
10. Wait for upload to complete (may take 10-30 minutes)

### Option B: Using Transporter App

1. Export the archive:
   - In Organizer, select archive → **Distribute App**
   - Select **App Store Connect** → **Export**
   - Save the `.ipa` file
2. Open **Transporter** app (from Mac App Store)
3. Drag the `.ipa` file into Transporter
4. Click **Deliver**

## Step 7: Process Build in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Select your **Fitness Tracker** app
3. Go to **TestFlight** tab
4. Wait for processing (usually 10-30 minutes)
5. You'll see a notification when processing is complete

## Step 8: Add Testers

### Internal Testing (Up to 100 testers, immediate access)

1. In TestFlight, go to **Internal Testing**
2. Click **+** to create a group (e.g., "Internal Testers")
3. Add testers by email (must be added to your App Store Connect team first)
4. Select the build you want to test
5. Click **Start Testing**

### External Testing (Up to 10,000 testers, requires review)

1. In TestFlight, go to **External Testing**
2. Click **+** to create a group
3. Add testers by email (they don't need to be in your team)
4. Fill in required information:
   - **What to Test**: Brief description of what testers should focus on
   - **App Information**: Screenshots, description, etc.
5. Submit for Beta App Review (first time only, takes 24-48 hours)
6. Once approved, select build and click **Start Testing**

## Step 9: Testers Install TestFlight

1. Testers receive an email invitation
2. They need to install **TestFlight** app from App Store (if not already installed)
3. Open the email on their iPhone and tap the invitation link
4. Or open TestFlight app and accept the invitation
5. Tap **Install** to download the app

## Troubleshooting

### App Store Connect Authentication Errors

**"App Store Connect Credentials Error" / "Fetching DVTActor for account" / Request timed out**

This is a common authentication issue. Try these solutions:

1. **Re-authenticate in Xcode:**
   - Go to **Xcode** → **Preferences** (or **Settings** on newer versions)
   - Go to **Accounts** tab
   - Select your Apple ID
   - Click **Download Manual Profiles** (if available)
   - Click the **-** button to remove the account
   - Click **+** to add it back
   - Sign in again with your Apple ID

2. **Clear Xcode Derived Data:**

   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

3. **Use App-Specific Password (if 2FA enabled):**
   - Go to [appleid.apple.com](https://appleid.apple.com)
   - Sign in → **Sign-In and Security** → **App-Specific Passwords**
   - Generate a new password
   - Use this password when Xcode prompts for authentication

4. **Try Alternative Upload Method:**
   - Instead of uploading from Xcode Organizer, export the archive:
     - In Organizer: Select archive → **Distribute App** → **Export**
     - Save as `.ipa` file
   - Use **Transporter** app (from Mac App Store) to upload
   - Or use command line: `xcrun altool --upload-app --file YourApp.ipa --type ios --apiKey YOUR_API_KEY --apiIssuer YOUR_ISSUER_ID`

5. **Check Network/Firewall:**
   - Ensure you're not behind a restrictive firewall
   - Try a different network connection
   - Disable VPN if active

6. **Wait and Retry:**
   - Sometimes Apple's servers are slow
   - Wait 10-15 minutes and try again
   - Check [Apple System Status](https://www.apple.com/support/systemstatus/) for outages

### Build Errors

**"No signing certificate found"**

- Go to Xcode → Preferences → Accounts
- Add your Apple ID
- Download certificates manually if needed

**"Provisioning profile doesn't match"**

- In Xcode, go to Signing & Capabilities
- Uncheck and recheck "Automatically manage signing"
- Clean build folder (Cmd+Shift+K) and rebuild

**"Bundle identifier is already in use"**

- Change to a unique bundle identifier
- Make sure it matches the App ID in Apple Developer Portal

### Validation Errors

**"Missing Info.plist value. A value for the Info.plist key 'CFBundleIconName' is missing"**

This error occurs when the app icon asset catalog isn't properly referenced. The fix has been applied to `Info.plist`:

- Added `CFBundleIconName` key with value `AppIcon`
- This references the `AppIcon.appiconset` in your asset catalog
- Rebuild and re-archive after this change

**"Missing required icon file. The bundle does not contain an app icon for iPhone / iPod Touch of exactly '120x120' pixels"**

This error means the icon asset catalog is configured but the actual icon image files are missing. You need to add icon images to your app:

**Option 1: Add Icons Manually in Xcode (Recommended)**

1. Open your project in Xcode
2. Navigate to `ios/FitnessTracker/Images.xcassets/AppIcon.appiconset`
3. You'll see placeholder slots for different icon sizes
4. Drag and drop your icon images into the appropriate slots:
   - **60x60@2x** = 120x120 pixels (required for iOS 10.0+)
   - **60x60@3x** = 180x180 pixels
   - **1024x1024** = App Store icon (required)
   - Other sizes as needed

5. Make sure all required sizes are filled (at minimum: 120x120 and 1024x1024)
6. Clean build folder (Cmd+Shift+K)
7. Rebuild and re-archive

**Option 2: Generate Icons from a Single Image**

If you have a 1024x1024 master icon:

1. Use an online tool like [AppIcon.co](https://www.appicon.co/) or [IconKitchen](https://icon.kitchen/)
2. Upload your 1024x1024 icon
3. Download the generated icon set
4. Replace the contents of `ios/FitnessTracker/Images.xcassets/AppIcon.appiconset/` with the generated icons
5. Update `Contents.json` if the tool generates a new one

**Option 3: Use React Native Asset Tools**

```bash
# Install react-native-asset (if not already installed)
pnpm add -D react-native-asset

# Create icons from a 1024x1024 source image
# Place your icon.png (1024x1024) in the project root, then:
npx react-native-asset --icon ./icon.png
```

**Minimum Required Icons:**

- **120x120** (60x60@2x) - Required for iOS 10.0+
- **180x180** (60x60@3x) - Required for modern devices
- **1024x1024** (App Store) - Required for App Store submission

After adding icons, clean build and re-archive.

**"Invalid purpose string value. The "" value for the NSHealthUpdateUsageDescription key isn't allowed"**

This error occurs when your app has HealthKit entitlements but the `NSHealthUpdateUsageDescription` key in `Info.plist` is empty. Apple requires a non-empty description for privacy compliance.

**Fix:**

- The fix has been applied to `Info.plist`
- Added a proper description: "Fitness Tracker may need write access to sync your health data and enable background updates for accurate tracking."
- Rebuild and re-archive after this change

**Note**: Even if your app only reads health data, Apple requires this key to be present and non-empty if HealthKit entitlements are enabled.

**"Upload Symbols Failed" / "The archive did not include a dSYM for the hermes.framework"**

This is a **warning, not a critical error**. It's a known React Native/Hermes issue and can usually be ignored:

- The app will still upload and work correctly
- This only affects crash symbolication for Hermes crashes
- If you need Hermes symbols, you can:
  1. In Xcode: **Product** → **Archive** → **Distribute App** → **Upload**
  2. Check **"Upload your app's symbols to receive symbolicated crash logs from Apple"**
  3. Or manually upload dSYMs later if needed

**Note**: For most React Native apps, this warning doesn't prevent TestFlight distribution.

### Upload Errors

**"Invalid Bundle"**

- Make sure you're uploading a Release build, not Debug
- Check that all required capabilities are enabled
- Verify bundle identifier matches App Store Connect

**"Missing Compliance"**

- In App Store Connect, go to your app → App Information
- Answer export compliance questions
- Usually: "No, this app does not use encryption"

### TestFlight Issues

**Build stuck in "Processing"**

- Wait at least 30 minutes
- Check email for any issues
- Try uploading a new build with incremented build number

**Testers can't install**

- Make sure they're using the same Apple ID email that received the invitation
- Check that the build has finished processing
- Verify the tester's device is compatible (iOS version)

## Quick Reference Commands

```bash
# Clean build
cd ios && xcodebuild clean -workspace FitnessTracker.xcworkspace -scheme FitnessTracker && cd ..

# Build for device (for testing before TestFlight)
pnpm ios --device

# Increment build number (manual)
# Edit ios/FitnessTracker.xcodeproj/project.pbxproj
# Or use Xcode: Target → General → Build number
```

## Important Notes

- **Build Number**: Must increment for each upload (even if version stays the same)
- **Version Number**: Can stay the same across builds
- **Processing Time**: First build takes longer (30-60 min), subsequent builds are faster (10-30 min)
- **TestFlight Expiration**: Builds expire after 90 days
- **Beta Review**: External testing requires Apple review (first time only, 24-48 hours)

## Next Steps After TestFlight

Once you're ready for App Store release:

1. Complete App Store listing (screenshots, description, etc.)
2. Submit for App Review
3. Wait for approval (typically 1-3 days)

For more details, see [Apple's TestFlight Documentation](https://developer.apple.com/testflight/)
