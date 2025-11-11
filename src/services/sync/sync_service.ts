import {
  MetricType,
  HealthDataStore,
  HealthMetricData,
  SyncStrategy,
  SyncConfig,
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
import { GetDateRange } from '@utils';

/**
 * Sync all health metrics
 */
export const SyncAllMetrics = async (days: number = 365): Promise<HealthDataStore> => {
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
 * Initialize empty health data store
 */
const InitializeHealthDataStore = (): HealthDataStore => {
  const metrics: Record<MetricType, HealthMetricData> = {} as Record<
    MetricType,
    HealthMetricData
  >;

  Object.values(MetricType).forEach((metricType) => {
    metrics[metricType] = {
      metricType,
      unit: METRIC_UNITS[metricType],
      dataPoints: [],
      lastSync: new Date(),
    };
  });

  return {
    metrics,
    exercises: [],
    lastFullSync: new Date(),
  };
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

