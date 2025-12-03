# Adding Native Modules to Xcode Project

## Step-by-Step Instructions

### 1. Open the Xcode Workspace

```bash
open ios/FitnessTracker.xcworkspace
```

**Important:** Use the `.xcworkspace` file, NOT the `.xcodeproj` file.

### 2. Locate the Files in Finder

The files should be at:

- `ios/FitnessTracker/AppGroupStorage.swift`
- `ios/FitnessTracker/AppGroupStorage.m`
- `ios/FitnessTracker/WidgetUpdater.swift`
- `ios/FitnessTracker/WidgetUpdater.m`

### 3. Add Files to Xcode Project

**Method 1: Drag and Drop (Easiest)**

1. In Xcode, look at the Project Navigator (left sidebar)
2. Find the `FitnessTracker` folder (the blue folder icon, not the yellow one)
3. Open Finder and navigate to `ios/FitnessTracker/`
4. Select all four files:
   - `AppGroupStorage.swift`
   - `AppGroupStorage.m`
   - `WidgetUpdater.swift`
   - `WidgetUpdater.m`
5. Drag them into the `FitnessTracker` folder in Xcode's Project Navigator
6. A dialog will appear:
   - ✅ **Check "Copy items if needed"** (if files aren't already in the right location)
   - ✅ **Check "Create groups"** (not "Create folder references")
   - ✅ **IMPORTANT: Check "FitnessTracker" under "Add to targets"**
   - Click "Finish"

**Method 2: Add Files Menu**

1. In Xcode, right-click on the `FitnessTracker` folder in Project Navigator
2. Select "Add Files to FitnessTracker..."
3. Navigate to `ios/FitnessTracker/`
4. Select all four files (hold Cmd to select multiple)
5. In the dialog:
   - ✅ **Uncheck "Copy items if needed"** (files are already in the right place)
   - ✅ **Select "Create groups"**
   - ✅ **IMPORTANT: Check "FitnessTracker" under "Add to targets"**
   - Click "Add"

### 4. Verify Files Are Added

1. In Project Navigator, you should see:
   - `AppGroupStorage.swift`
   - `AppGroupStorage.m`
   - `WidgetUpdater.swift`
   - `WidgetUpdater.m`

   All under the `FitnessTracker` folder

2. If any file appears in **red**, it means Xcode can't find it:
   - Right-click the red file
   - Select "Delete" → "Remove Reference" (don't move to trash)
   - Re-add it using Method 1 or 2 above

### 5. Verify Build Phases

1. Select the `FitnessTracker` project (blue icon at top of Project Navigator)
2. Select the `FitnessTracker` target (under TARGETS)
3. Click the "Build Phases" tab
4. Expand "Compile Sources"
5. Verify all four files are listed:
   - `AppGroupStorage.swift`
   - `AppGroupStorage.m`
   - `WidgetUpdater.swift`
   - `WidgetUpdater.m`

6. If any are missing:
   - Click the "+" button
   - Search for the missing file
   - Add it

### 6. Clean and Rebuild

1. In Xcode menu: Product → Clean Build Folder (Shift+Cmd+K)
2. Then: Product → Build (Cmd+B)

### 7. Verify It Works

After rebuilding, run the app. You should see:

- ✅ No "App Group storage not available" warnings in console
- ✅ Migration logs showing data being copied
- ✅ Widget can read data from App Group storage

## Troubleshooting

**Files appear in red:**

- The file path is broken. Remove the reference and re-add the files.

**Build errors about missing symbols:**

- Make sure files are added to the `FitnessTracker` target (not just the project)
- Check Build Phases → Compile Sources includes all files

**Module still not found:**

- Clean build folder (Shift+Cmd+K)
- Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/FitnessTracker-*`
- Rebuild

**Swift/Objective-C bridging issues:**

- Make sure both `.swift` and `.m` files are in the same target
- Xcode should automatically create a bridging header if needed
