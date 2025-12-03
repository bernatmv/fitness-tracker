import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HealthDataStore,
  AppConfig,
  UserPreferences,
  MetricType,
  HealthMetricData,
  MetricConfig,
} from '@types';
import { GetAllPalettes, GetPaletteColorsById } from '@constants';
import { appGroupStorage } from './app_group_storage';
import { widgetUpdater } from '../widget';
import { MigrateToAppGroup } from './migrate_to_app_group';

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  HEALTH_DATA: '@fitness_tracker:health_data',
  APP_CONFIG: '@fitness_tracker:app_config',
  USER_PREFERENCES: '@fitness_tracker:user_preferences',
  LAST_SYNC: '@fitness_tracker:last_sync',
} as const;

/**
 * Storage adapter that uses App Group storage on iOS when available,
 * otherwise falls back to AsyncStorage
 */
class StorageAdapter {
  private useAppGroup: boolean | null = null;

  private async ShouldUseAppGroup(): Promise<boolean> {
    if (this.useAppGroup !== null) {
      return this.useAppGroup;
    }

    try {
      this.useAppGroup = await appGroupStorage.IsAvailable();
      return this.useAppGroup;
    } catch (error) {
      console.warn('Failed to check App Group availability:', error);
      this.useAppGroup = false;
      return false;
    }
  }

  async SetItem(key: string, value: string): Promise<void> {
    const useAppGroup = await this.ShouldUseAppGroup();
    if (useAppGroup) {
      await appGroupStorage.SetItem(key, value);
      // Also write to AsyncStorage as backup (for migration purposes)
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        // Non-critical, continue
        console.warn('Failed to write to AsyncStorage backup:', error);
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }

  async GetItem(key: string): Promise<string | null> {
    const useAppGroup = await this.ShouldUseAppGroup();
    if (useAppGroup) {
      return await appGroupStorage.GetItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  }

  async RemoveItem(key: string): Promise<void> {
    const useAppGroup = await this.ShouldUseAppGroup();
    if (useAppGroup) {
      await appGroupStorage.RemoveItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }

  async MultiRemove(keys: string[]): Promise<void> {
    const useAppGroup = await this.ShouldUseAppGroup();
    if (useAppGroup) {
      // App Group storage doesn't have multiRemove, so remove one by one
      await Promise.all(keys.map(key => appGroupStorage.RemoveItem(key)));
    } else {
      await AsyncStorage.multiRemove(keys);
    }
  }
}

const storageAdapter = new StorageAdapter();

/**
 * Find matching palette for old color array
 * Compares colors with palette light mode colors
 */
const FindMatchingPalette = (colors: string[]): string => {
  const palettes = GetAllPalettes();

  // Normalize colors for comparison (lowercase, remove spaces)
  const normalizeColor = (color: string) => color.toLowerCase().trim();
  const normalizedOldColors = colors.map(normalizeColor);

  // Try to find exact match with light mode colors
  for (const palette of palettes) {
    const paletteColors = GetPaletteColorsById(palette.id, 'light');
    const normalizedPaletteColors = paletteColors.map(normalizeColor);

    if (
      normalizedOldColors.length === normalizedPaletteColors.length &&
      normalizedOldColors.every(
        (color, index) => color === normalizedPaletteColors[index]
      )
    ) {
      return palette.id;
    }
  }

  // If no exact match, default to github_green
  return 'github_green';
};

/**
 * Serialize health data to JSON with proper date formatting
 */
const SerializeHealthData = (data: HealthDataStore): string => {
  const serialized = {
    ...data,
    lastFullSync: data.lastFullSync.toISOString(),
    metrics: Object.entries(data.metrics).reduce(
      (acc, [key, metric]) => {
        acc[key] = {
          ...metric,
          lastSync: metric.lastSync.toISOString(),
          dataPoints: metric.dataPoints.map(dp => ({
            ...dp,
            date: dp.date.toISOString(),
            metricType: dp.metricType,
            unit: dp.unit,
          })),
        };
        return acc;
      },
      {} as Record<string, unknown>
    ),
    exercises: data.exercises.map(ex => ({
      ...ex,
      date: ex.date.toISOString(),
    })),
  };
  return JSON.stringify(serialized);
};

/**
 * Save health data to storage
 */
export const SaveHealthData = async (data: HealthDataStore): Promise<void> => {
  try {
    const jsonData = SerializeHealthData(data);
    const metricsCount = Object.keys(data.metrics).length;
    const totalDataPoints = Object.values(data.metrics).reduce(
      (sum, metric) => sum + metric.dataPoints.length,
      0
    );
    console.log(
      `Saving health data to storage: ${metricsCount} metrics, ${totalDataPoints} data points`
    );
    await storageAdapter.SetItem(STORAGE_KEYS.HEALTH_DATA, jsonData);

    // Verify data was saved (especially important for App Group storage)
    const saved = await storageAdapter.GetItem(STORAGE_KEYS.HEALTH_DATA);
    if (saved) {
      console.log('Health data saved and verified successfully');
      // Debug: List all keys in App Group storage
      if (await appGroupStorage.IsAvailable()) {
        const allKeys = await appGroupStorage.GetAllKeys();
        console.log(
          `App Group storage keys (${allKeys.length} total):`,
          allKeys.sort()
        );
      }
    } else {
      console.warn(
        'Health data save verification failed - data may not be accessible to widget'
      );
    }

    // Update widgets with new data
    console.log('Reloading widgets...');
    await widgetUpdater.ReloadAllTimelines();
    console.log('Widget reload complete');
  } catch (error) {
    console.error('Error saving health data:', error);
    throw new Error('Failed to save health data');
  }
};

/**
 * Load health data from storage
 */
export const LoadHealthData = async (): Promise<HealthDataStore | null> => {
  try {
    const jsonData = await storageAdapter.GetItem(STORAGE_KEYS.HEALTH_DATA);
    if (!jsonData) return null;

    const data = JSON.parse(jsonData);
    // Convert date strings back to Date objects
    data.lastFullSync = new Date(data.lastFullSync);
    Object.values(data.metrics).forEach((metric: unknown) => {
      const m = metric as HealthMetricData;
      m.lastSync = new Date(m.lastSync);
      m.dataPoints = m.dataPoints.map(dp => ({
        ...dp,
        date: new Date(dp.date),
      }));
    });

    return data;
  } catch (error) {
    console.error('Error loading health data:', error);
    return null;
  }
};

/**
 * Save app configuration
 */
export const SaveAppConfig = async (config: AppConfig): Promise<void> => {
  try {
    const jsonData = JSON.stringify(config);
    await storageAdapter.SetItem(STORAGE_KEYS.APP_CONFIG, jsonData);
  } catch (error) {
    console.error('Error saving app config:', error);
    throw new Error('Failed to save app config');
  }
};

/**
 * Load app configuration
 */
export const LoadAppConfig = async (): Promise<AppConfig | null> => {
  try {
    const jsonData = await storageAdapter.GetItem(STORAGE_KEYS.APP_CONFIG);
    if (!jsonData) return null;

    const config = JSON.parse(jsonData);
    config.lastModified = new Date(config.lastModified);

    return config;
  } catch (error) {
    console.error('Error loading app config:', error);
    return null;
  }
};

/**
 * Save user preferences
 */
export const SaveUserPreferences = async (
  preferences: UserPreferences
): Promise<void> => {
  try {
    const jsonData = JSON.stringify(preferences);
    await storageAdapter.SetItem(STORAGE_KEYS.USER_PREFERENCES, jsonData);
    // Update widgets when preferences change (affects which metrics are shown)
    await widgetUpdater.ReloadAllTimelines();
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw new Error('Failed to save user preferences');
  }
};

/**
 * Load user preferences
 */
export const LoadUserPreferences =
  async (): Promise<UserPreferences | null> => {
    try {
      const jsonData = await storageAdapter.GetItem(
        STORAGE_KEYS.USER_PREFERENCES
      );
      if (!jsonData) return null;

      const preferences = JSON.parse(jsonData);

      // Migration: add enableMultiRowLayout if it doesn't exist
      if (
        preferences &&
        typeof preferences.enableMultiRowLayout === 'undefined'
      ) {
        preferences.enableMultiRowLayout = false;
        await SaveUserPreferences(preferences);
      }

      // Migration: convert old colorRange.colors to colorRange.paletteId
      if (preferences && preferences.metricConfigs) {
        let needsMigration = false;
        const migratedConfigs: Record<MetricType, MetricConfig> = {
          ...preferences.metricConfigs,
        };

        Object.entries(preferences.metricConfigs).forEach(
          ([metricType, config]) => {
            const metricConfig = config as MetricConfig;
            // Check if this is old format (has colors array instead of paletteId)
            if (
              metricConfig.colorRange &&
              'colors' in metricConfig.colorRange &&
              !('paletteId' in metricConfig.colorRange)
            ) {
              needsMigration = true;
              // Try to find matching palette by comparing colors
              const oldColors = (
                metricConfig.colorRange as { colors: string[] }
              ).colors;
              const matchingPalette = FindMatchingPalette(oldColors);

              migratedConfigs[metricType as MetricType] = {
                ...metricConfig,
                colorRange: {
                  thresholds: metricConfig.colorRange.thresholds,
                  paletteId: matchingPalette,
                },
              };
            }
          }
        );

        if (needsMigration) {
          preferences.metricConfigs = migratedConfigs;
          await SaveUserPreferences(preferences);
        }
      }

      return preferences;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  };

/**
 * Save metric data for a specific metric type
 */
export const SaveMetricData = async (
  metricType: MetricType,
  data: HealthMetricData
): Promise<void> => {
  try {
    const healthData = await LoadHealthData();
    if (!healthData) {
      throw new Error('Health data store not initialized');
    }

    healthData.metrics[metricType] = data;
    await SaveHealthData(healthData);
    // Widgets are updated by SaveHealthData
  } catch (error) {
    console.error(`Error saving metric data for ${metricType}:`, error);
    throw new Error('Failed to save metric data');
  }
};

/**
 * Clear all health data from storage
 */
export const ClearAllHealthData = async (): Promise<void> => {
  try {
    await storageAdapter.RemoveItem(STORAGE_KEYS.HEALTH_DATA);
  } catch (error) {
    console.error('Error clearing health data:', error);
    throw new Error('Failed to clear health data');
  }
};

/**
 * Load metric data for a specific metric type
 */
export const LoadMetricData = async (
  metricType: MetricType
): Promise<HealthMetricData | null> => {
  try {
    const healthData = await LoadHealthData();
    if (!healthData) return null;

    return healthData.metrics[metricType] || null;
  } catch (error) {
    console.error(`Error loading metric data for ${metricType}:`, error);
    return null;
  }
};

/**
 * Clear user preferences (for testing or reset)
 */
export const ClearUserPreferences = async (): Promise<void> => {
  try {
    await storageAdapter.RemoveItem(STORAGE_KEYS.USER_PREFERENCES);
  } catch (error) {
    console.error('Error clearing user preferences:', error);
    throw new Error('Failed to clear user preferences');
  }
};

/**
 * Clear all storage (for testing or reset)
 */
export const ClearAllStorage = async (): Promise<void> => {
  try {
    await storageAdapter.MultiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw new Error('Failed to clear storage');
  }
};

/**
 * Update last sync timestamp
 */
export const UpdateLastSyncTime = async (): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    await storageAdapter.SetItem(STORAGE_KEYS.LAST_SYNC, timestamp);
    // Update widgets to show new sync time
    await widgetUpdater.ReloadAllTimelines();
  } catch (error) {
    console.error('Error updating last sync time:', error);
  }
};

/**
 * Get last sync timestamp
 */
export const GetLastSyncTime = async (): Promise<Date | null> => {
  try {
    const timestamp = await storageAdapter.GetItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};
