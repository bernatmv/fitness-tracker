# Ruby and CocoaPods Setup

## Current Status

✅ **Ruby upgraded**: Ruby 3.4.7 is now installed via Homebrew and configured in PATH
✅ **CocoaPods installed**: CocoaPods 1.16.2 is installed with Ruby 3.4.7
⚠️ **Xcode Project Format 70**: xcodeproj 1.27.0 doesn't support format 70 yet

## Configuration

The Homebrew Ruby path has been added to `~/.zshrc`:
```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
```

**To use the new Ruby in your current terminal session:**
```bash
source ~/.zshrc
# or
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
```

## Xcode Project Format 70 Issue

The Xcode project uses format version 70, but xcodeproj 1.27.0 (latest stable) doesn't support it yet. This is a known issue tracked at:
- https://github.com/CocoaPods/CocoaPods/issues/12840

### Solutions

**Option 1: Wait for xcodeproj update** (Recommended)
- Monitor the GitHub issue for updates
- When xcodeproj 1.28.0+ is released, run: `gem update xcodeproj`

**Option 2: Temporarily downgrade project format** (Workaround)
- Edit `ios/FitnessTracker.xcodeproj/project.pbxproj`
- Change `objectVersion = 70;` to `objectVersion = 56;`
- Run `pod install`
- Note: Xcode may upgrade it back to 70 when you open the project

**Option 3: Use Xcode to manage pods** (Alternative)
- Open the project in Xcode
- Let Xcode handle pod integration
- This may work around the format 70 issue

## Verification

Check your Ruby version:
```bash
ruby -v
# Should show: ruby 3.4.7
```

Check CocoaPods version:
```bash
pod --version
# Should show: 1.16.2
```

## Next Steps

1. **For widget development**: The Android widget is ready. For iOS, you can create the widget extension in Xcode even if `pod install` has issues.

2. **For pod updates**: When xcodeproj is updated to support format 70, you can run:
   ```bash
   gem update xcodeproj
   cd ios && pod install
   ```

3. **For now**: You can continue development. The pods are already installed from the previous successful run (when format was temporarily downgraded).

