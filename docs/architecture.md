# Architecture Documentation

## Overview

The Fitness Tracker app follows a layered architecture pattern with clear separation of concerns. The architecture is designed to be:

- **Maintainable**: Easy to understand and modify
- **Testable**: Each layer can be tested independently
- **Scalable**: New features can be added without major refactoring
- **Type-safe**: Full TypeScript coverage ensures compile-time safety

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Screens, Components, Navigation)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│     (Services, State Management)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Data Layer                     │
│   (Storage, API, Health Data Access)    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Platform Layer                    │
│    (iOS HealthKit, Android Health       │
│     Connect, Native Modules)            │
└─────────────────────────────────────────┘
```

## Layer Details

### 1. Presentation Layer

**Location**: `src/screens/`, `src/components/`, `src/navigation/`

**Responsibilities**:
- Render UI components
- Handle user interactions
- Manage local component state
- Navigate between screens

**Key Components**:

```typescript
// Screen Component Pattern
interface ScreenProps {
  navigation: NavigationProp;
  route: RouteProp;
}

const Screen: React.FC<ScreenProps> = ({ navigation, route }) => {
  const [state, setState] = useState();
  
  useEffect(() => {
    // Load data on mount
  }, []);
  
  return <View>...</View>;
};
```

**Best Practices**:
- Keep screens focused on UI rendering
- Delegate business logic to services
- Use hooks for data fetching
- Implement loading and error states

### 2. Business Logic Layer

**Location**: `src/services/`

**Responsibilities**:
- Implement business rules
- Coordinate data operations
- Handle complex workflows
- Manage data transformations

**Service Architecture**:

```
services/
├── health_data/
│   └── health_service.ts     # Health data API abstraction
├── storage/
│   └── storage_service.ts    # Local storage operations
└── sync/
    └── sync_service.ts       # Data synchronization logic
```

**Service Pattern**:

```typescript
// Pure function pattern for services
export const ServiceFunction = async (
  params: InputType
): Promise<OutputType> => {
  // Business logic implementation
  return result;
};
```

### 3. Data Layer

**Location**: `src/services/storage/`, `src/services/health_data/`

**Responsibilities**:
- Abstract data access
- Handle data persistence
- Manage cache
- Serialize/deserialize data

**Data Flow**:

```
User Action → Screen → Service → Data Layer → Platform API
                ↓                     ↓
            UI Update ← Service ← Data Layer ← Response
```

### 4. Platform Layer

**Location**: Native modules, third-party libraries

**Responsibilities**:
- Access native platform APIs
- Handle platform-specific code
- Bridge React Native and native code

## Data Flow

### Reading Data

```typescript
// 1. User opens screen
HomeScreen → LoadData()
  
// 2. Service fetches from storage
  → LoadHealthData()
  
// 3. Storage reads from AsyncStorage
    → AsyncStorage.getItem()
    
// 4. Data flows back up
      → parse → transform → setState → render
```

### Writing Data

```typescript
// 1. User triggers sync
HomeScreen → HandleSync()

// 2. Service fetches from health API
  → SyncAllMetrics()
  
// 3. Health service queries platform
    → FetchMetricData() → HealthKit/Health Connect
    
// 4. Service saves to storage
      → SaveHealthData() → AsyncStorage
      
// 5. UI updates
        → setState → re-render
```

## State Management

The app uses React hooks for state management:

### Local State
```typescript
// Component-level state
const [data, setData] = useState<Data>();
```

### Derived State
```typescript
// Computed from props or state
const stats = useMemo(() => {
  return calculateStats(data);
}, [data]);
```

### Side Effects
```typescript
// Data fetching, subscriptions
useEffect(() => {
  loadData();
  return () => cleanup();
}, [dependencies]);
```

## Type System

### Type Organization

```
types/
├── health_metrics.ts    # Health data types
├── config.ts           # Configuration types
├── theme.ts            # UI theme types
└── index.ts            # Central exports
```

### Type Patterns

**Enums for Constants**:
```typescript
export enum MetricType {
  CALORIES_BURNED = 'CALORIES_BURNED',
  STEPS = 'STEPS',
}
```

**Interfaces for Data Structures**:
```typescript
export interface HealthDataPoint {
  date: Date;
  value: number;
  metricType: MetricType;
}
```

**Type Aliases for Complex Types**:
```typescript
export type AsyncState<T> = {
  state: LoadingState;
  data?: T;
  error?: string;
};
```

## Service Patterns

### Pure Service Functions

```typescript
// Services should be pure functions
export const CalculateStatistics = (
  dataPoints: HealthDataPoint[]
): Statistics => {
  // No side effects
  // Same input → same output
  return {
    average: calculateAverage(dataPoints),
    total: calculateTotal(dataPoints),
  };
};
```

### Async Service Functions

```typescript
// Async operations with proper error handling
export const FetchData = async (
  params: Params
): Promise<Result> => {
  try {
    const data = await apiCall(params);
    return transform(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Failed to fetch data');
  }
};
```

## Error Handling

### Error Boundaries

```typescript
// Component-level error handling
try {
  await operation();
  setLoadingState(LoadingState.SUCCESS);
} catch (error) {
  console.error('Error:', error);
  setLoadingState(LoadingState.ERROR);
  setError(error.message);
}
```

### Service-level Errors

```typescript
// Service functions throw typed errors
class ServiceError extends Error {
  constructor(
    message: string,
    public code: ErrorCode
  ) {
    super(message);
  }
}
```

## Testing Strategy

### Unit Tests
- Test pure functions in isolation
- Mock external dependencies
- Focus on business logic

### Integration Tests
- Test service interactions
- Test data flow between layers
- Mock platform APIs

### Component Tests
- Test rendering logic
- Test user interactions
- Test state changes

### E2E Tests
- Test complete user flows
- Test on real devices
- Test platform integrations

## Performance Considerations

### Optimization Strategies

1. **Memoization**:
```typescript
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

2. **Callback Stability**:
```typescript
const handlePress = useCallback(() => {
  doSomething(param);
}, [param]);
```

3. **List Virtualization**:
```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
/>
```

4. **Code Splitting**:
```typescript
// Lazy load screens
const Screen = React.lazy(() => import('./Screen'));
```

## Security Considerations

### Data Storage
- Encrypt sensitive data
- Use secure storage for credentials
- Clear data on logout

### API Communication
- Use HTTPS only
- Validate all inputs
- Sanitize user data

### Health Data
- Request minimal permissions
- Respect user privacy
- Never share health data externally

## Scalability

### Adding New Features

1. Define types in `src/types/`
2. Implement service in `src/services/`
3. Create components in `src/components/`
4. Add screens in `src/screens/`
5. Update navigation
6. Write tests

### Adding New Metrics

1. Add to `MetricType` enum
2. Add default config
3. Update health service
4. Add translations
5. Test on both platforms

## Platform-Specific Code

### Conditional Imports
```typescript
import { Platform } from 'react-native';

const HealthService = Platform.select({
  ios: () => require('./health_service.ios'),
  android: () => require('./health_service.android'),
})();
```

### Platform Checks
```typescript
if (Platform.OS === 'ios') {
  // iOS-specific code
} else {
  // Android-specific code
}
```

## Future Enhancements

### Potential Improvements
- Add Redux for global state (if app grows)
- Implement offline queue for sync
- Add real-time health data observers
- Implement data export/import
- Add social features
- Implement achievements/gamification

### Technical Debt
- Complete Android Health Connect implementation
- Add comprehensive E2E tests
- Implement background sync
- Add widget support
- Optimize bundle size

