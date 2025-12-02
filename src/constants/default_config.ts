import {
  MetricType,
  MetricUnit,
  MetricConfig,
  SyncStrategy,
  ThemePreference,
} from '@types';
import { GetPaletteColorsById } from './color_palettes';

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
      thresholds: [0, 500, 800, 950, 1200],
      paletteId: 'ios_health_red',
    },
  },
  [MetricType.STEPS]: {
    metricType: MetricType.STEPS,
    enabled: true,
    displayName: 'Steps',
    colorRange: {
      thresholds: [0, 2000, 5000, 10000, 15000],
      paletteId: 'github_green',
    },
  },
  [MetricType.EXERCISE_TIME]: {
    metricType: MetricType.EXERCISE_TIME,
    enabled: true,
    displayName: 'Exercise Time',
    colorRange: {
      thresholds: [0, 15, 30, 60, 120],
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
    displayName: 'Hours of Sleep',
    colorRange: {
      thresholds: [0, 6, 7, 8, 9],
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
 * @param thresholdIndex - The index of the threshold (0-4)
 * @param mode - The theme mode ('light' or 'dark')
 */
export const GetSuggestedColorsForThreshold = (
  thresholdIndex: number,
  mode: 'light' | 'dark' = 'light'
): string[] => {
  const suggestedColors = new Set<string>();

  Object.values(DEFAULT_METRIC_CONFIGS).forEach(config => {
    const colors = GetPaletteColorsById(config.colorRange.paletteId, mode);
    if (thresholdIndex < colors.length) {
      suggestedColors.add(colors[thresholdIndex]);
    }
  });

  // Convert to array and remove duplicates
  return Array.from(suggestedColors);
};
