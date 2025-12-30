import { appGroupStorage } from '@services/storage/app_group_storage';
import { STORAGE_KEYS } from '@services/storage/storage_service';
import { widgetUpdater } from './widget_updater';

export type WidgetDiagnostics = {
  appGroupAvailable: boolean;
  widgetUpdaterAvailable: boolean;
  appGroupKeys: string[];
  hasHealthData: boolean;
  hasUserPreferences: boolean;
};

const HasValue = (value: string | null): boolean => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * Widget diagnostics helper.
 *
 * This is intended to help debug situations where the widget shows placeholder/skeleton UI
 * (often caused by missing App Group entitlements in a distribution build).
 */
export const GetWidgetDiagnostics = async (): Promise<WidgetDiagnostics> => {
  const appGroupAvailable = await appGroupStorage.IsAvailable();
  const widgetUpdaterAvailable = widgetUpdater.IsAvailable();

  const [healthData, userPreferences, appGroupKeys] = await Promise.all([
    appGroupStorage.GetItem(STORAGE_KEYS.HEALTH_DATA),
    appGroupStorage.GetItem(STORAGE_KEYS.USER_PREFERENCES),
    appGroupStorage.GetAllKeys(),
  ]);

  return {
    appGroupAvailable,
    widgetUpdaterAvailable,
    appGroupKeys: appGroupKeys.sort(),
    hasHealthData: HasValue(healthData),
    hasUserPreferences: HasValue(userPreferences),
  };
};


