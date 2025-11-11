import { MetricType, MetricUnit, MetricConfig, SyncStrategy } from '@types';

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
      thresholds: [0, 800, 950, 1200, Infinity],
      colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      baseColor: '#40c463',
    },
  },
  [MetricType.EXERCISE_TIME]: {
    metricType: MetricType.EXERCISE_TIME,
    enabled: true,
    displayName: 'Exercise Time',
    colorRange: {
      thresholds: [0, 15, 30, 60, Infinity],
      colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      baseColor: '#40c463',
    },
  },
  [MetricType.STANDING_TIME]: {
    metricType: MetricType.STANDING_TIME,
    enabled: true,
    displayName: 'Standing Time',
    colorRange: {
      thresholds: [0, 180, 360, 540, Infinity],
      colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      baseColor: '#40c463',
    },
  },
  [MetricType.STEPS]: {
    metricType: MetricType.STEPS,
    enabled: true,
    displayName: 'Steps',
    colorRange: {
      thresholds: [0, 5000, 8000, 10000, Infinity],
      colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      baseColor: '#40c463',
    },
  },
  [MetricType.FLOORS_CLIMBED]: {
    metricType: MetricType.FLOORS_CLIMBED,
    enabled: true,
    displayName: 'Floors Climbed',
    colorRange: {
      thresholds: [0, 3, 6, 10, Infinity],
      colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      baseColor: '#40c463',
    },
  },
  [MetricType.SLEEP_HOURS]: {
    metricType: MetricType.SLEEP_HOURS,
    enabled: true,
    displayName: 'Hours of Sleep',
    colorRange: {
      thresholds: [0, 5, 7, 8, Infinity],
      colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      baseColor: '#40c463',
    },
  },
};

/**
 * Metric type to unit mapping
 */
export const METRIC_UNITS: Record<MetricType, MetricUnit> = {
  [MetricType.CALORIES_BURNED]: MetricUnit.CALORIES,
  [MetricType.EXERCISE_TIME]: MetricUnit.MINUTES,
  [MetricType.STANDING_TIME]: MetricUnit.MINUTES,
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

