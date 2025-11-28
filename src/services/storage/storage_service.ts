import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HealthDataStore,
  AppConfig,
  UserPreferences,
  MetricType,
  HealthMetricData,
} from '@types';

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  HEALTH_DATA: '@fitness_tracker:health_data',
  APP_CONFIG: '@fitness_tracker:app_config',
  USER_PREFERENCES: '@fitness_tracker:user_preferences',
  LAST_SYNC: '@fitness_tracker:last_sync',
} as const;

/**
 * Save health data to storage
 */
export const SaveHealthData = async (data: HealthDataStore): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data);
    await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_DATA, jsonData);
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
    const jsonData = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_DATA);
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
    await AsyncStorage.setItem(STORAGE_KEYS.APP_CONFIG, jsonData);
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
    const jsonData = await AsyncStorage.getItem(STORAGE_KEYS.APP_CONFIG);
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
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, jsonData);
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
      const jsonData = await AsyncStorage.getItem(
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
  } catch (error) {
    console.error(`Error saving metric data for ${metricType}:`, error);
    throw new Error('Failed to save metric data');
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
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
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
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
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
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  } catch (error) {
    console.error('Error updating last sync time:', error);
  }
};

/**
 * Get last sync timestamp
 */
export const GetLastSyncTime = async (): Promise<Date | null> => {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};
