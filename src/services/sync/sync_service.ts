import {
  MetricType,
  HealthDataStore,
  HealthMetricData,
  HealthDataPoint,
  SyncStrategy,
  SyncConfig,
  ExerciseDetail,
} from '@types';
import { METRIC_UNITS } from '@constants';
import {
  FetchMetricData,
  FetchExercises,
  CheckHealthPermissions,
} from '../health_data';
import {
  SaveHealthData,
  LoadHealthData,
  UpdateLastSyncTime,
  GetLastSyncTime,
} from '../storage';
import { GetDateRange, GetStartOfDay, GetDateArray } from '@utils';

/**
 * Sync all health metrics
 */
export const SyncAllMetrics = async (
  days: number = 365
): Promise<HealthDataStore> => {
  const hasPermission = await CheckHealthPermissions();
  if (!hasPermission) {
    throw new Error('Health data permissions not granted');
  }

  const { start, end } = GetDateRange(days);
  const metricTypes = Object.values(MetricType);

  // Load existing data or create new store
  let healthDataStore = await LoadHealthData();
  if (!healthDataStore) {
    healthDataStore = InitializeHealthDataStore();
  }

  // Fetch data for each metric
  for (const metricType of metricTypes) {
    try {
      const dataPoints = await FetchMetricData(metricType, start, end);

      const metricData: HealthMetricData = {
        metricType,
        unit: METRIC_UNITS[metricType],
        dataPoints,
        lastSync: new Date(),
      };

      healthDataStore.metrics[metricType] = metricData;
    } catch (error) {
      console.error(`Error syncing ${metricType}:`, error);
      // Continue with other metrics even if one fails
    }
  }

  // Fetch exercises
  try {
    const exercises = await FetchExercises(start, end);
    healthDataStore.exercises = exercises;
  } catch (error) {
    console.error('Error syncing exercises:', error);
  }

  // Update timestamps
  healthDataStore.lastFullSync = new Date();

  // Ensure each metric has at least 365 days of data
  healthDataStore = EnsureMinimumDays(healthDataStore);

  // Save to storage
  await SaveHealthData(healthDataStore);
  await UpdateLastSyncTime();

  return healthDataStore;
};

/**
 * Sync all health data from all available time
 * This will overwrite existing data for each day
 */
export const SyncAllDataFromAllTime = async (): Promise<HealthDataStore> => {
  const hasPermission = await CheckHealthPermissions();
  if (!hasPermission) {
    throw new Error('Health data permissions not granted');
  }

  // Use a very early date (10 years ago) to get all available data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 10);

  const metricTypes = Object.values(MetricType);

  // Load existing data or create new store
  let healthDataStore = await LoadHealthData();
  if (!healthDataStore) {
    healthDataStore = InitializeHealthDataStore();
  }

  // Fetch data for each metric and merge/overwrite by date
  for (const metricType of metricTypes) {
    try {
      const newDataPoints = await FetchMetricData(
        metricType,
        startDate,
        endDate
      );

      // Create a map of existing data points by date string
      const existingDataMap = new Map<string, HealthDataPoint>();
      if (healthDataStore.metrics[metricType]) {
        healthDataStore.metrics[metricType].dataPoints.forEach(dp => {
          const dateKey = dp.date.toISOString().split('T')[0];
          existingDataMap.set(dateKey, dp);
        });
      }

      // Overwrite existing data points with new data
      newDataPoints.forEach(newDp => {
        const dateKey = newDp.date.toISOString().split('T')[0];
        existingDataMap.set(dateKey, newDp);
      });

      // Convert map back to array and sort by date
      const mergedDataPoints = Array.from(existingDataMap.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      const metricData: HealthMetricData = {
        metricType,
        unit: METRIC_UNITS[metricType],
        dataPoints: mergedDataPoints,
        lastSync: new Date(),
      };

      healthDataStore.metrics[metricType] = metricData;
    } catch (error) {
      console.error(`Error syncing ${metricType}:`, error);
      // Continue with other metrics even if one fails
    }
  }

  // Fetch exercises and merge
  try {
    const newExercises = await FetchExercises(startDate, endDate);
    // Merge exercises by ID, keeping existing ones and adding new ones
    const existingExerciseMap = new Map<string, ExerciseDetail>();
    healthDataStore.exercises.forEach((ex: ExerciseDetail) => {
      existingExerciseMap.set(ex.id, ex);
    });
    newExercises.forEach((newEx: ExerciseDetail) => {
      existingExerciseMap.set(newEx.id, newEx);
    });
    healthDataStore.exercises = Array.from(existingExerciseMap.values());
  } catch (error) {
    console.error('Error syncing exercises:', error);
  }

  // Update timestamps
  healthDataStore.lastFullSync = new Date();

  // Ensure each metric has at least 365 days of data
  healthDataStore = EnsureMinimumDays(healthDataStore);

  // Save to storage
  await SaveHealthData(healthDataStore);
  await UpdateLastSyncTime();

  return healthDataStore;
};

/**
 * Sync a single metric
 */
export const SyncMetric = async (
  metricType: MetricType,
  days: number = 365
): Promise<HealthMetricData> => {
  const hasPermission = await CheckHealthPermissions();
  if (!hasPermission) {
    throw new Error('Health data permissions not granted');
  }

  const { start, end } = GetDateRange(days);
  const dataPoints = await FetchMetricData(metricType, start, end);

  const metricData: HealthMetricData = {
    metricType,
    unit: METRIC_UNITS[metricType],
    dataPoints,
    lastSync: new Date(),
  };

  // Update in storage
  let healthDataStore = await LoadHealthData();
  if (!healthDataStore) {
    healthDataStore = InitializeHealthDataStore();
  }

  healthDataStore.metrics[metricType] = metricData;

  // Ensure each metric has at least 365 days of data
  healthDataStore = EnsureMinimumDays(healthDataStore);

  await SaveHealthData(healthDataStore);
  await UpdateLastSyncTime();

  return metricData;
};

/**
 * Get sync status
 */
export const GetSyncStatus = async (): Promise<{
  lastSync: Date | null;
  needsSync: boolean;
  syncIntervalMinutes: number;
}> => {
  const lastSync = await GetLastSyncTime();
  const syncIntervalMinutes = 120; // Default 2 hours

  let needsSync = true;
  if (lastSync) {
    const minutesSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60);
    needsSync = minutesSinceSync >= syncIntervalMinutes;
  }

  return {
    lastSync,
    needsSync,
    syncIntervalMinutes,
  };
};

/**
 * Check if sync is needed based on strategy
 */
export const ShouldSync = async (syncConfig: SyncConfig): Promise<boolean> => {
  const { lastSync, needsSync } = await GetSyncStatus();

  switch (syncConfig.strategy) {
    case SyncStrategy.ON_APP_OPEN:
      return lastSync === null; // Only sync on first open

    case SyncStrategy.PERIODIC:
      return needsSync;

    case SyncStrategy.HYBRID:
      return needsSync;

    case SyncStrategy.HEALTH_OBSERVER:
      return false; // Handled by observers

    default:
      return needsSync;
  }
};

/**
 * Ensure each metric has at least 365 days of data
 * Pads missing days with zero-value data points
 *
 * IMPORTANT: This function NEVER overwrites existing data.
 * It only adds zero-value data points for dates that don't have any data.
 * All existing data points are preserved exactly as they are.
 */
const EnsureMinimumDays = (
  healthDataStore: HealthDataStore
): HealthDataStore => {
  const today = GetStartOfDay(new Date());
  const minDays = 365;
  const startDate = GetStartOfDay(
    new Date(today.getTime() - (minDays - 1) * 24 * 60 * 60 * 1000)
  );

  // Generate array of all dates for the last 365 days
  const allDates = GetDateArray(startDate, today);

  // Process each metric
  const updatedMetrics: Record<MetricType, HealthMetricData> = {
    ...healthDataStore.metrics,
  };

  Object.values(MetricType).forEach(metricType => {
    const metricData = healthDataStore.metrics[metricType];

    // Initialize if missing
    if (!metricData) {
      // Create zero-value data points for all 365 days
      const emptyDataPoints: HealthDataPoint[] = allDates.map(date => ({
        date,
        value: 0,
        metricType,
        unit: METRIC_UNITS[metricType],
      }));

      updatedMetrics[metricType] = {
        metricType,
        unit: METRIC_UNITS[metricType],
        dataPoints: emptyDataPoints,
        lastSync: new Date(),
      };
      return;
    }

    // Create a map of existing data points by date
    // IMPORTANT: This preserves all existing data - we never overwrite it
    const existingDataMap = new Map<string, HealthDataPoint>();
    metricData.dataPoints.forEach((dp: HealthDataPoint) => {
      const dateKey = GetStartOfDay(dp.date).toISOString().split('T')[0];
      // If multiple data points exist for the same date, keep the first one
      // (shouldn't happen, but this ensures we preserve existing data)
      if (!existingDataMap.has(dateKey)) {
        existingDataMap.set(dateKey, dp);
      }
    });

    // Create data points for all dates, using existing data or zero values
    // CRITICAL: We only create zero-value points for dates that don't have existing data
    const paddedDataPoints: HealthDataPoint[] = allDates.map(date => {
      const dateKey = date.toISOString().split('T')[0];
      const existing = existingDataMap.get(dateKey);

      // Always prefer existing data - never overwrite with zero values
      if (existing) {
        return existing;
      }

      // Only create zero-value data point if no existing data exists for this date
      return {
        date,
        value: 0,
        metricType,
        unit: METRIC_UNITS[metricType],
      };
    });

    // Sort by date to ensure chronological order
    paddedDataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

    updatedMetrics[metricType] = {
      ...metricData,
      dataPoints: paddedDataPoints,
    };
  });

  return {
    ...healthDataStore,
    metrics: updatedMetrics,
  };
};

/**
 * Initialize empty health data store
 */
const InitializeHealthDataStore = (): HealthDataStore => {
  const metrics: Record<MetricType, HealthMetricData> = {} as Record<
    MetricType,
    HealthMetricData
  >;

  Object.values(MetricType).forEach(metricType => {
    metrics[metricType] = {
      metricType,
      unit: METRIC_UNITS[metricType],
      dataPoints: [],
      lastSync: new Date(),
    };
  });

  const emptyStore: HealthDataStore = {
    metrics,
    exercises: [],
    lastFullSync: new Date(),
  };

  // Ensure minimum days even for empty store
  return EnsureMinimumDays(emptyStore);
};

/**
 * Setup background sync (platform specific)
 */
export const SetupBackgroundSync = async (
  syncConfig: SyncConfig
): Promise<void> => {
  // TODO: Implement platform-specific background sync
  // iOS: Use BackgroundFetch or HealthKit observers
  // Android: Use WorkManager for periodic sync
  console.log('Background sync configuration:', syncConfig);
  console.warn('Background sync not yet fully implemented');
};

/**
 * Cancel background sync
 */
export const CancelBackgroundSync = async (): Promise<void> => {
  // TODO: Implement cancellation of background tasks
  console.warn('Cancel background sync not yet implemented');
};

/**
 * Check if health data exists for today
 */
const HasDataForToday = (healthDataStore: HealthDataStore | null): boolean => {
  if (!healthDataStore) {
    return false;
  }

  const today = GetStartOfDay(new Date());
  const todayKey = today.toISOString().split('T')[0];

  // Check if any metric has data for today
  for (const metricData of Object.values(healthDataStore.metrics)) {
    const hasTodayData = metricData.dataPoints.some(dp => {
      const dpKey = GetStartOfDay(dp.date).toISOString().split('T')[0];
      return dpKey === todayKey;
    });

    if (hasTodayData) {
      return true;
    }
  }

  return false;
};

/**
 * Sync health data when app becomes active
 * Fetches 7 days if no data for today, otherwise fetches just today
 */
export const SyncOnAppActive = async (): Promise<HealthDataStore | null> => {
  const hasPermission = await CheckHealthPermissions();
  if (!hasPermission) {
    // Silently fail if permissions not granted
    return null;
  }

  // Load existing data
  const existingData = await LoadHealthData();
  const hasTodayData = HasDataForToday(existingData);

  // Determine how many days to fetch
  const daysToFetch = hasTodayData ? 1 : 7;

  const { start, end } = GetDateRange(daysToFetch);
  const metricTypes = Object.values(MetricType);

  // Load or create health data store
  let healthDataStore = existingData;
  if (!healthDataStore) {
    healthDataStore = InitializeHealthDataStore();
  }

  // Fetch and merge data for each metric
  for (const metricType of metricTypes) {
    try {
      const newDataPoints = await FetchMetricData(metricType, start, end);

      // Create a map of existing data points by date string
      const existingDataMap = new Map<string, HealthDataPoint>();
      if (healthDataStore.metrics[metricType]) {
        healthDataStore.metrics[metricType].dataPoints.forEach(
          (dp: HealthDataPoint) => {
            const dateKey = GetStartOfDay(dp.date).toISOString().split('T')[0];
            existingDataMap.set(dateKey, dp);
          }
        );
      }

      // Merge new data points (overwrite existing dates)
      newDataPoints.forEach((newDp: HealthDataPoint) => {
        const dateKey = GetStartOfDay(newDp.date).toISOString().split('T')[0];
        existingDataMap.set(dateKey, newDp);
      });

      // Convert map back to array and sort by date
      const mergedDataPoints = Array.from(existingDataMap.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      const metricData: HealthMetricData = {
        metricType,
        unit: METRIC_UNITS[metricType],
        dataPoints: mergedDataPoints,
        lastSync: new Date(),
      };

      healthDataStore.metrics[metricType] = metricData;
    } catch (error) {
      console.error(`Error syncing ${metricType} on app active:`, error);
      // Continue with other metrics even if one fails
    }
  }

  // Fetch and merge exercises
  try {
    const newExercises = await FetchExercises(start, end);
    const existingExerciseMap = new Map<string, ExerciseDetail>();
    healthDataStore.exercises.forEach((ex: ExerciseDetail) => {
      existingExerciseMap.set(ex.id, ex);
    });
    newExercises.forEach((newEx: ExerciseDetail) => {
      existingExerciseMap.set(newEx.id, newEx);
    });
    healthDataStore.exercises = Array.from(existingExerciseMap.values());
  } catch (error) {
    console.error('Error syncing exercises on app active:', error);
  }

  // Update timestamps
  healthDataStore.lastFullSync = new Date();

  // Ensure each metric has at least 365 days of data
  healthDataStore = EnsureMinimumDays(healthDataStore);

  // Save to storage
  await SaveHealthData(healthDataStore);
  await UpdateLastSyncTime();

  return healthDataStore;
};
