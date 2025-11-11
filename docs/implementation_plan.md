# Fitness Tracker - Implementation Plan

## Overview
Building a cross-platform fitness tracker with GitHub-like activity walls and widget support.

## Phase 1: Project Setup
- Initialize React Native with TypeScript template
- Configure PNPM as package manager
- Set up ESLint, Prettier, Jest configuration
- Install core dependencies:
  - React Native Elements (UI components)
  - React Navigation (navigation)
  - AsyncStorage (local storage)
  - react-native-health (iOS HealthKit)
  - react-native-health-connect (Android)
  - i18next (internationalization)

## Phase 2: Core Architecture
### Folder Structure
```
src/
├── components/         # Reusable UI components
│   ├── activity_wall/  # GitHub-like heat map
│   ├── common/         # Buttons, cards, etc.
│   └── __tests__/
├── screens/            # Screen components
│   ├── home/
│   ├── settings/
│   ├── metric_detail/
│   └── onboarding/
├── services/           # Business logic
│   ├── health_data/    # Health data abstraction
│   ├── storage/        # Local storage
│   └── sync/           # Sync logic
├── types/              # TypeScript definitions
├── locales/            # Translation files
│   ├── en.json
│   └── es.json
├── constants/          # App constants
├── utils/              # Utility functions
└── __tests__/
```

## Phase 3: Health Data Integration
### Metrics to Track
1. Calories burned (Active energy)
2. Exercise time
3. Standing time
4. Steps
5. Floors climbed
6. Hours of sleep
7. Exercise details

### Platform-Specific APIs
- **iOS**: HealthKit via react-native-health
- **Android**: Health Connect via react-native-health-connect

### Abstraction Layer
Create unified interface that works across both platforms.

## Phase 4: Data Model
### Default Thresholds
```typescript
CaloriesBurned: {
  ranges: [0, 800, 950, 1200, Infinity],
  colors: ['#9be9a8', '#40c463', '#30a14e', '#216e39'] // GitHub green
}

ExerciseTime: {
  ranges: [0, 15, 30, 60, Infinity], // minutes
  colors: ['#9be9a8', '#40c463', '#30a14e', '#216e39']
}

Steps: {
  ranges: [0, 5000, 8000, 10000, Infinity],
  colors: ['#9be9a8', '#40c463', '#30a14e', '#216e39']
}

// ... similar for other metrics
```

## Phase 5: UI Components
### Core Components
1. **ActivityWall** - GitHub-like heat map
   - Configurable date range
   - Tap to see details
   - Color intensity based on thresholds
   
2. **MetricCard** - Display single metric summary
   - Current value
   - Trend indicator
   - Mini activity wall

3. **ThresholdConfig** - UI for setting thresholds
   - Color picker
   - Range sliders
   - Preview

4. **DateRangePicker** - Select date ranges
   - Last 7, 30, 90, 365 days
   - Custom range

## Phase 6: Sync Strategy
### Options
1. **On app open** - Simplest, may miss updates
2. **Periodic background sync** - Every 1-4 hours
3. **Health data observer** - React to health app changes (iOS only)
4. **Hybrid approach** (Recommended):
   - Sync on app open
   - Background sync every 2 hours (when possible)
   - iOS: Subscribe to HealthKit observers
   - Manual refresh option

## Phase 7: Widget Implementation
### Widget Sizes
- Small: Last 7 days for single metric
- Medium: Last 14 days for single metric
- Large: Last 30 days or multiple metrics

### Technical Approach
- iOS: WidgetKit with Swift
- Android: App Widgets with Kotlin/Java
- Share data via SharedStorage/UserDefaults

## Phase 8: Testing Strategy
### Unit Tests
- Utility functions
- Data transformations
- Threshold calculations
- Color generation

### Component Tests
- React component rendering
- User interactions
- State management

### Integration Tests
- Health data service
- Storage operations
- Sync logic

### E2E Tests (Playwright)
- Onboarding flow
- Permission requests
- Metric configuration
- Widget updates

## Phase 9: Internationalization
### Initial Languages
- English (en)
- Spanish (es)

### Translation Keys
- Screen titles
- Button labels
- Metric names
- Error messages
- Onboarding instructions

## Phase 10: Polish & Optimization
- Performance optimization
- Error handling
- Loading states
- Empty states
- Accessibility
- Dark mode support

## Development Principles
Following AGENTS.md:
- ✅ Test-first development
- ✅ Small, focused components
- ✅ SOLID principles
- ✅ TypeScript for everything
- ✅ No hardcoded colors
- ✅ Locale-based formatting
- ✅ Small diffs per feature

