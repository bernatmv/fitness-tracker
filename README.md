# Fitness Tracker

A beautiful cross-platform mobile app to track your fitness journey with GitHub-like activity visualizations.

## Features

### 📊 Health Data Tracking
- **Calories Burned** - Active energy expenditure
- **Exercise Time** - Daily workout duration
- **Standing Time** - Time spent standing
- **Steps** - Daily step count
- **Floors Climbed** - Stairs and elevation
- **Sleep Hours** - Nightly sleep duration
- **Exercise Details** - Comprehensive workout data

### 🎨 Beautiful Visualizations
- **Activity Wall** - GitHub-style heat map for each metric
- **Customizable Colors** - Choose your preferred color schemes
- **Configurable Thresholds** - Set personal goals and ranges
- **Interactive Details** - Tap any day to see detailed statistics

### 📱 Cross-Platform
- **iOS** - Integrates with Apple HealthKit
- **Android** - Integrates with Health Connect
- **Unified Experience** - Consistent UI across platforms

### 🌍 Internationalization
- **Multiple Languages** - English and Spanish (more coming soon)
- **Locale-aware** - Date and number formatting based on device settings

### ⚙️ Flexible Configuration
- **Sync Strategies** - On-demand, periodic, or hybrid syncing
- **Privacy-first** - All data stays on your device
- **Customizable Metrics** - Enable/disable metrics as needed

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **React Navigation** - Seamless navigation
- **React Native Elements** - Beautiful UI components
- **i18next** - Internationalization
- **AsyncStorage** - Local data persistence
- **Jest** - Testing framework

## Getting Started

### Prerequisites

- Node.js (v18+)
- PNPM (v8+)
- Xcode (for iOS, macOS only)
- Android Studio (for Android)

### Quick Start

```bash
# Install dependencies
pnpm install

# Run on iOS
pnpm ios

# Run on Android
pnpm android
```

For detailed setup instructions, see [Setup Guide](./docs/setup_guide.md).

## Documentation

- **[Setup Guide](./docs/setup_guide.md)** - Complete installation and configuration
- **[Development Guide](./docs/development_guide.md)** - Development workflow and best practices
- **[Architecture](./docs/architecture.md)** - Technical architecture and patterns
- **[Implementation Plan](./docs/implementation_plan.md)** - Project roadmap and features

## Project Structure

```
fitness-tracker/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   ├── navigation/      # Navigation setup
│   ├── services/        # Business logic
│   ├── types/           # TypeScript definitions
│   ├── locales/         # Translations
│   ├── constants/       # App constants
│   └── utils/           # Utility functions
├── docs/                # Documentation
├── android/             # Android native code
└── ios/                 # iOS native code
```

## Development

### Available Scripts

```bash
# Start development
pnpm start           # Start Metro bundler
pnpm ios             # Run iOS app
pnpm android         # Run Android app

# Code quality
pnpm lint            # Run ESLint
pnpm format          # Format with Prettier
pnpm type-check      # TypeScript type checking

# Testing
pnpm test            # Run tests
pnpm test -- --watch # Run tests in watch mode
```

## Features Status

✅ Completed
- Project setup and configuration
- Type definitions and constants
- Health data service (iOS HealthKit)
- Storage service
- Sync service
- Activity Wall component
- Home screen with metric cards
- Settings screen
- Metric detail screen
- Metric configuration screen
- Onboarding flow
- Navigation structure
- Internationalization (EN, ES)

🚧 In Progress
- Android Health Connect integration
- Widget implementation

📋 Planned
- Background sync optimization
- Data export/import
- Additional languages
- Dark mode
- Social features
- Achievements

## Contributing

Contributions are welcome! Please read the [Development Guide](./docs/development_guide.md) for details on our development process and coding standards.

## License

[Your License Here]

## Acknowledgments

- GitHub for the activity visualization inspiration
- React Native community for excellent tools and libraries
- All contributors to this project
