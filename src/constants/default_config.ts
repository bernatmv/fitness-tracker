import {
  MetricType,
  MetricUnit,
  MetricConfig,
  SyncStrategy,
  ThemePreference,
} from '@types';

/**
 * Default color ranges for each metric type
 * Using palette IDs instead of color arrays
 */
export const DEFAULT_METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  [MetricType.CALORIES_BURNED]: {
    metricType: MetricType.CALORIES_BURNED,
    enabled: true,
    displayName: 'Calories Burned',
    colorRange: {
      thresholds: [0, 700, 850, 1000, 1200],
      paletteId: 'ios_health_red',
    },
  },
  [MetricType.STEPS]: {
    metricType: MetricType.STEPS,
    enabled: true,
    displayName: 'Steps',
    colorRange: {
      thresholds: [0, 3000, 6000, 10000, 15000],
      paletteId: 'github_green',
    },
  },
  [MetricType.EXERCISE_TIME]: {
    metricType: MetricType.EXERCISE_TIME,
    enabled: true,
    displayName: 'Exercise Time',
    colorRange: {
      thresholds: [0, 30, 60, 100, 150],
      paletteId: 'github_green',
    },
  },
  [MetricType.STANDING_TIME]: {
    metricType: MetricType.STANDING_TIME,
    enabled: true,
    displayName: 'Standing Time',
    colorRange: {
      thresholds: [0, 6, 8, 10, 12],
      paletteId: 'ios_health_blue',
    },
  },
  [MetricType.FLOORS_CLIMBED]: {
    metricType: MetricType.FLOORS_CLIMBED,
    enabled: true,
    displayName: 'Floors Climbed',
    colorRange: {
      thresholds: [0, 5, 10, 15, 25],
      paletteId: 'github_green',
    },
  },
  [MetricType.SLEEP_HOURS]: {
    metricType: MetricType.SLEEP_HOURS,
    enabled: true,
    displayName: 'Sleep',
    colorRange: {
      // Stored in minutes
      thresholds: [0, 300, 360, 420, 480],
      paletteId: 'ios_health_purple',
    },
  },
};

/**
 * Metric type to unit mapping
 */
export const METRIC_UNITS: Record<MetricType, MetricUnit> = {
  [MetricType.CALORIES_BURNED]: MetricUnit.CALORIES,
  [MetricType.EXERCISE_TIME]: MetricUnit.MINUTES,
  [MetricType.STANDING_TIME]: MetricUnit.HOURS,
  [MetricType.STEPS]: MetricUnit.STEPS,
  [MetricType.FLOORS_CLIMBED]: MetricUnit.FLOORS,
  [MetricType.SLEEP_HOURS]: MetricUnit.MINUTES,
};

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG = {
  strategy: SyncStrategy.HYBRID,
  periodicIntervalMinutes: 120, // 2 hours
  enableHealthObserver: true,
};

/**
 * How many years back each history sync reaches.
 * INITIAL caps the automatic first-launch sync so a fresh install stays
 * fast; deeper history is available on demand from Settings.
 */
export const SYNC_YEARS = {
  INITIAL: 2,
  RECENT: 5,
  FULL: 10,
} as const;

/**
 * App version
 */
export const APP_VERSION = '1.0.0';

/**
 * Default theme preference
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
