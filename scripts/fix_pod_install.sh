#!/bin/bash

# Script to temporarily fix CocoaPods Xcode project format 70 issue
# This downgrades the project format to 56, runs pod install, then restores it

set -e

PROJECT_FILE="ios/FitnessTracker.xcodeproj/project.pbxproj"
BACKUP_FILE="${PROJECT_FILE}.backup"

cd "$(dirname "$0")/.."

echo "🔧 Fixing CocoaPods compatibility issue..."

# Check if project file exists
if [ ! -f "$PROJECT_FILE" ]; then
    echo "❌ Error: Project file not found at $PROJECT_FILE"
    exit 1
fi

# Create backup
echo "📦 Creating backup..."
cp "$PROJECT_FILE" "$BACKUP_FILE"

# Check current version
CURRENT_VERSION=$(grep -o "objectVersion = [0-9]*" "$PROJECT_FILE" | grep -o "[0-9]*")
echo "📋 Current project format version: $CURRENT_VERSION"

if [ "$CURRENT_VERSION" = "70" ]; then
    echo "⚠️  Project uses format 70 (not supported by xcodeproj 1.27.0)"
    echo "🔽 Temporarily downgrading to format 56..."
    
    # Downgrade to 56
    sed -i '' 's/objectVersion = 70;/objectVersion = 56;/' "$PROJECT_FILE"
    
    echo "✅ Downgraded to format 56"
    echo "📦 Running pod install..."
    
    cd ios
    if pod install; then
        echo "✅ Pod install successful!"
        echo ""
        echo "⚠️  Note: Xcode may upgrade the project format back to 70 when you open it."
        echo "   If pod install fails again, run this script again."
    else
        echo "❌ Pod install failed. Restoring backup..."
        mv "$BACKUP_FILE" "$PROJECT_FILE"
        exit 1
    fi
else
    echo "✅ Project format is $CURRENT_VERSION (compatible)"
    echo "📦 Running pod install..."
    cd ios
    pod install
fi

# Clean up backup (optional - uncomment if you want to keep it)
# rm -f "$BACKUP_FILE"

echo ""
echo "✨ Done!"

