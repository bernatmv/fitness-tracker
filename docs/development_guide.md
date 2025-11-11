# Development Guide

## Project Structure

```
fitness-tracker/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── activity_wall/   # GitHub-like heat map component
│   │   ├── common/          # Shared components (buttons, cards, etc.)
│   │   └── __tests__/       # Component tests
│   ├── screens/             # Screen components
│   │   ├── home/            # Home screen with metric cards
│   │   ├── settings/        # Settings and preferences
│   │   ├── metric_detail/   # Detailed metric view
│   │   └── onboarding/      # First-time setup flow
│   ├── services/            # Business logic layer
│   │   ├── health_data/     # Health data API abstraction
│   │   ├── storage/         # Local storage management
│   │   └── sync/            # Data synchronization
│   ├── navigation/          # React Navigation setup
│   ├── types/               # TypeScript type definitions
│   ├── locales/             # i18n translation files
│   ├── constants/           # App constants and defaults
│   ├── utils/               # Utility functions
│   └── App.tsx              # Main app component
├── docs/                    # Documentation
├── android/                 # Android native code
├── ios/                     # iOS native code
└── __tests__/              # Test files
```

## Development Workflow

### 1. Setting Up Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd fitness-tracker

# Install dependencies
pnpm install

# iOS specific (macOS only)
cd ios
pod install
cd ..
```

### 2. Running the App

```bash
# Start Metro bundler
pnpm start

# Run on iOS (macOS only)
pnpm ios

# Run on Android
pnpm android
```

### 3. Development Commands

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch
```

## Architecture

### Service Layer

The app uses a service-oriented architecture with three main services:

#### Health Data Service
- Abstracts iOS HealthKit and Android Health Connect
- Provides unified interface for health data access
- Handles permission requests

#### Storage Service
- Manages local data persistence with AsyncStorage
- Stores health data, user preferences, and app configuration
- Handles data serialization/deserialization

#### Sync Service
- Coordinates data synchronization
- Implements multiple sync strategies (on-demand, periodic, hybrid)
- Manages background sync tasks

### Component Architecture

Components follow these principles:
- **Single Responsibility**: Each component has one clear purpose
- **Composition**: Build complex UIs from small, reusable components
- **Type Safety**: All components are fully typed with TypeScript
- **Testability**: Components are designed to be easily testable

### State Management

The app uses React hooks for local state management:
- `useState` for component-local state
- `useEffect` for side effects and data loading
- `useCallback` for optimized function references
- Custom hooks can be added as needed

### Type System

All types are centrally defined in `src/types/`:
- `health_metrics.ts` - Health data types
- `config.ts` - Configuration and preferences
- `theme.ts` - UI theme types
- `index.ts` - Re-exports and utility types

## Testing Strategy

### Unit Tests
Test individual functions and utilities:
```typescript
// Example: Testing color utilities
describe('GetColorForValue', () => {
  it('should return correct color for value in range', () => {
    const thresholds = [0, 100, 200, Infinity];
    const colors = ['#color1', '#color2', '#color3', '#color4'];
    expect(GetColorForValue(150, thresholds, colors)).toBe('#color2');
  });
});
```

### Component Tests
Test component rendering and interactions:
```typescript
// Example: Testing ActivityWall
describe('ActivityWall', () => {
  it('should render correct number of cells', () => {
    const { getAllByTestId } = render(
      <ActivityWall
        dataPoints={mockData}
        thresholds={mockThresholds}
        colors={mockColors}
        numDays={7}
      />
    );
    const cells = getAllByTestId(/activity-cell/);
    expect(cells.length).toBe(7);
  });
});
```

### Integration Tests
Test service interactions:
```typescript
// Example: Testing sync service
describe('SyncService', () => {
  it('should sync all metrics successfully', async () => {
    const data = await SyncAllMetrics(30);
    expect(data.metrics).toBeDefined();
    expect(Object.keys(data.metrics).length).toBeGreaterThan(0);
  });
});
```

## Best Practices

### Code Style
- Use PascalCase for components and functions
- Use snake_case for file names
- Keep functions small and focused
- Prefer pure functions when possible
- Always add types to function parameters and return values

### Component Guidelines
1. Keep components small (< 200 lines)
2. Extract complex logic to custom hooks or utilities
3. Use meaningful component and prop names
4. Add JSDoc comments for complex components
5. Include testID props for testing

### Performance Optimization
- Use `React.memo` for expensive components
- Implement `useMemo` for expensive calculations
- Use `useCallback` for function props
- Optimize list rendering with `FlatList`
- Lazy load screens with React Navigation

### Error Handling
- Always wrap async operations in try-catch
- Provide user-friendly error messages
- Log errors for debugging
- Implement retry mechanisms for network operations

## Internationalization

### Adding New Languages

1. Create new locale file:
```bash
src/locales/fr.json
```

2. Add translations:
```json
{
  "common": {
    "app_name": "Fitness Tracker",
    "save": "Enregistrer",
    ...
  }
}
```

3. Register in i18n configuration:
```typescript
// src/locales/i18n.ts
import fr from './fr.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },  // Add here
};
```

### Using Translations

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return <Text>{t('common.app_name')}</Text>;
};
```

## Platform-Specific Code

### iOS
- HealthKit integration requires Info.plist configuration
- Add usage descriptions for health data access
- Test on physical devices for health data

### Android
- Health Connect requires API level 34+
- Add permissions in AndroidManifest.xml
- Test with Health Connect app installed

## Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
# Clear cache and restart
pnpm start -- --reset-cache
```

**iOS build issues:**
```bash
# Clean build
cd ios
xcodebuild clean
pod install
cd ..
```

**Android build issues:**
```bash
# Clean build
cd android
./gradlew clean
cd ..
```

**Type errors:**
```bash
# Regenerate TypeScript types
pnpm type-check
```

## Contributing

1. Create a feature branch
2. Write tests first (TDD approach)
3. Implement the feature
4. Ensure all tests pass
5. Format code with Prettier
6. Create a pull request with clear description

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Elements](https://reactnativeelements.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing](https://jestjs.io/)

