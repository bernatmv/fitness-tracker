import {
  MetricType,
  MetricUnit,
  MetricConfig,
  SyncStrategy,
  ThemePreference,
} from '@types';

/**
 * Default color ranges for each metric type
 * Using GitHub-like green color scheme as default
 */
export const DEFAULT_METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  [MetricType.CALORIES_BURNED]: {
    metricType: MetricType.CALORIES_BURNED,
    enabled: true,
    displayName: 'Calories Burned',
    colorRange: {
      thresholds: [0, 500, 800, 950, 1200],
      // iOS Health app-like reds for calories burned (darkest first)
      colors: ['#EFF2F5', '#c0392b', '#e74c3c', '#f9827c', '#f9b8b2'],
      baseColor: '#e74c3c',
    },
  },
  [MetricType.STEPS]: {
    metricType: MetricType.STEPS,
    enabled: true,
    displayName: 'Steps',
    colorRange: {
      thresholds: [0, 2000, 5000, 10000, 15000],
      colors: ['#EFF2F5', '#216e39', '#30a14e', '#40c463', '#9be9a8'],
      baseColor: '#40c463',
    },
  },
  [MetricType.EXERCISE_TIME]: {
    metricType: MetricType.EXERCISE_TIME,
    enabled: true,
    displayName: 'Exercise Time',
    colorRange: {
      thresholds: [0, 15, 30, 60, 120],
      // Greens inspired by the iOS Health app (darkest first)
      colors: ['#EFF2F5', '#1eae4a', '#34c759', '#7cefa1', '#bdf6d8'],
      baseColor: '#34c759',
    },
  },
  [MetricType.STANDING_TIME]: {
    metricType: MetricType.STANDING_TIME,
    enabled: true,
    displayName: 'Standing Time',
    colorRange: {
      thresholds: [0, 6, 8, 10, 12],
      // iOS Health app-like blues for standing time (darkest first)
      colors: ['#EFF2F5', '#004a99', '#007aff', '#6ec1f6', '#b3dbf7'],
      baseColor: '#6ec1f6',
    },
  },
  [MetricType.FLOORS_CLIMBED]: {
    metricType: MetricType.FLOORS_CLIMBED,
    enabled: true,
    displayName: 'Floors Climbed',
    colorRange: {
      thresholds: [0, 5, 10, 15, 25],
      colors: ['#EFF2F5', '#216e39', '#30a14e', '#40c463', '#9be9a8'],
      baseColor: '#40c463',
    },
  },
  [MetricType.SLEEP_HOURS]: {
    metricType: MetricType.SLEEP_HOURS,
    enabled: true,
    displayName: 'Hours of Sleep',
    colorRange: {
      thresholds: [0, 6, 7, 8, 9],
      // Purples inspired by the iOS Health app for sleep hours (darkest first)
      colors: ['#EFF2F5', '#5e3370', '#8e44ad', '#a580e8', '#d1b3ff'],
      baseColor: '#8e44ad',
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
  [MetricType.SLEEP_HOURS]: MetricUnit.HOURS,
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
 * App version
 */
export const APP_VERSION = '1.0.0';

/**
 * Default theme preference
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

/**
 * Get all default colors for a specific threshold level across all metrics
 * This is used to provide suggested colors in the color picker
 */
export const GetSuggestedColorsForThreshold = (
  thresholdIndex: number
): string[] => {
  const suggestedColors = new Set<string>();

  Object.values(DEFAULT_METRIC_CONFIGS).forEach(config => {
    if (thresholdIndex < config.colorRange.colors.length) {
      suggestedColors.add(config.colorRange.colors[thresholdIndex]);
    }
  });

  // Convert to array and remove duplicates
  return Array.from(suggestedColors);
};
