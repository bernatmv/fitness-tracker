#!/bin/sh
# Xcode Cloud post-clone step: install JS dependencies and CocoaPods
# before xcodebuild runs. Xcode Cloud images ship without node/pnpm,
# and Pods/ is gitignored, so the workspace's xcconfig/xcfilelist
# references don't exist until `pod install` generates them.
set -e

export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

command -v node >/dev/null 2>&1 || brew install node
command -v pnpm >/dev/null 2>&1 || brew install pnpm
command -v pod >/dev/null 2>&1 || brew install cocoapods

# Install JS dependencies (postinstall runs react-native codegen)
cd "$CI_PRIMARY_REPOSITORY_PATH"
pnpm install --frozen-lockfile

# Generate Pods/ (xcconfigs, xcfilelists, frameworks)
cd ios
pod install
