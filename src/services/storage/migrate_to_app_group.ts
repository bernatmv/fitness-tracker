import AsyncStorage from '@react-native-async-storage/async-storage';
import { appGroupStorage } from './app_group_storage';
import { STORAGE_KEYS } from './storage_service';

/**
 * Migrate data from AsyncStorage to App Group storage
 * This ensures widget can access data even if it was previously stored in AsyncStorage
 */
export const MigrateToAppGroup = async (): Promise<void> => {
  try {
    const isAvailable = await appGroupStorage.IsAvailable();
    if (!isAvailable) {
      // This is expected if the native module isn't loaded yet or App Groups aren't configured
      // The storage service will fall back to AsyncStorage, which is fine
      // Widgets will work once the native module is properly set up
      return;
    }
    // Migrate health data
    const healthData = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_DATA);
    if (healthData) {
      const existing = await appGroupStorage.GetItem(STORAGE_KEYS.HEALTH_DATA);
      if (!existing) {
        await appGroupStorage.SetItem(STORAGE_KEYS.HEALTH_DATA, healthData);
        console.log('Migrated health data to App Group storage');
      }
    }

    // Migrate user preferences
    const preferences = await AsyncStorage.getItem(
      STORAGE_KEYS.USER_PREFERENCES
    );
    if (preferences) {
      const existing = await appGroupStorage.GetItem(
        STORAGE_KEYS.USER_PREFERENCES
      );
      if (!existing) {
        await appGroupStorage.SetItem(
          STORAGE_KEYS.USER_PREFERENCES,
          preferences
        );
        console.log('Migrated user preferences to App Group storage');
      }
    }

    // Migrate app config
    const appConfig = await AsyncStorage.getItem(STORAGE_KEYS.APP_CONFIG);
    if (appConfig) {
      const existing = await appGroupStorage.GetItem(STORAGE_KEYS.APP_CONFIG);
      if (!existing) {
        await appGroupStorage.SetItem(STORAGE_KEYS.APP_CONFIG, appConfig);
        console.log('Migrated app config to App Group storage');
      }
    }

    // Migrate last sync time
    const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (lastSync) {
      const existing = await appGroupStorage.GetItem(STORAGE_KEYS.LAST_SYNC);
      if (!existing) {
        await appGroupStorage.SetItem(STORAGE_KEYS.LAST_SYNC, lastSync);
        console.log('Migrated last sync time to App Group storage');
      }
    }
  } catch (error) {
    console.error('Error migrating to App Group storage:', error);
  }
};
