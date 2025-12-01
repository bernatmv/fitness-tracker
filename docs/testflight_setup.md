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

