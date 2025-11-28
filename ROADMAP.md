# Roadmap

This document outlines the planned improvements and features for the Fitness Tracker app.

## High Priority

### 🏗️ Architecture & Code Quality

- **SPLIT WALL AND OTHER PART INTO SMALLER COMPONENTS!!!!!**
  - Refactor ActivityWall into smaller, more manageable components
  - Break down other large components for better maintainability
  - Improve code organization and reusability

### 📱 App Distribution

- **Get app on TestFlight so I can test on phone**
  - Set up TestFlight distribution
  - Configure app signing and provisioning
  - Enable beta testing on physical devices

## Data Management

### 🔄 Sync & Data Loading

- **First sync to load all data**
  - Implement initial full data sync on first launch
  - Check that we are storing from that point on
  - Add options in settings to resync all data

- **Option in settings to reload all data**
  - Add manual "Reload All Data" button in settings
  - Clear existing data and perform full sync
  - Show progress indicator during reload

- **Open/wakeup only reloads last 30 days**
  - Optimize app wake behavior to only sync recent data
  - Full sync only on manual request or first launch
  - Improve app startup performance

- **Schedule to reload data when new data**
  - Implement background sync scheduling
  - Detect when new health data is available
  - Automatically sync new data periodically

- **Last sync based on user pull and not on app wake?**
  - Consider changing last sync timestamp logic
  - Track sync time based on user-initiated actions
  - Improve sync status accuracy

## User Experience

### ⚙️ Configuration

- **Improve configure**
  - Enhance metric configuration screen UX
  - Add more configuration options
  - Improve threshold and color configuration flow

### 📝 Content & Localization

- **Improve copies**
  - Review and improve all UI text
  - Make messaging clearer and more user-friendly
  - Ensure consistent tone throughout the app

- **Improve translation (quality and missing ones)**
  - Review existing translations for quality
  - Complete missing translations
  - Add support for additional languages
  - Ensure all new features are translated

### 🎨 Design & Visual

- **Ask for more attractive design?**
  - Review current design and gather feedback
  - Consider design improvements
  - Enhance visual appeal and user experience

- **Add yellow star if 50% more than top threshold**
  - Add visual indicator for exceptional performance
  - Show star icon when value exceeds top threshold by 50%
  - Highlight outstanding achievements

## Features

### 📊 Widgets

- **Check widgets**
  - Review widget implementation
  - Ensure widgets work correctly
  - Test widget updates and data display
  - Fix any widget-related issues

### 🚀 App Launch

- **App wake loading screen**
  - Add loading screen when app wakes up
  - Show sync progress if needed
  - Improve perceived performance

### 🎯 Onboarding

- **Onboarding screen**
  - Review and improve onboarding flow
  - Ensure all steps are clear and helpful
  - Test onboarding experience

## Notes

- Items are not necessarily in priority order
- Some items may be combined or reorganized as development progresses
- Feedback and suggestions are welcome
