import { appGroupStorage } from '@services/storage/app_group_storage';
import { STORAGE_KEYS } from '@services/storage/storage_service';
import { widgetUpdater } from './widget_updater';
import { WIDGET_DATA_FILE, WIDGET_PREFERENCES_FILE } from './widget_payload';

export type WidgetDiagnostics = {
  appGroupAvailable: boolean;
  widgetUpdaterAvailable: boolean;
  appGroupKeys: string[];
  /** Full store present in the shared suite (app-side storage) */
  hasHealthData: boolean;
  /** Trimmed widget payload file the widget actually reads */
  hasWidgetData: boolean;
  /** Size of the widget payload file, to sanity-check it stays small */
  widgetDataChars: number;
  /** Preferences file the widget actually reads */
  hasWidgetPreferences: boolean;
  /** Preferences present in the shared suite (app-side storage) */
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

  const [
    healthData,
    widgetData,
    widgetPreferences,
    userPreferences,
    appGroupKeys,
  ] = await Promise.all([
    appGroupStorage.GetItem(STORAGE_KEYS.HEALTH_DATA),
    appGroupStorage.GetFile(WIDGET_DATA_FILE),
    appGroupStorage.GetFile(WIDGET_PREFERENCES_FILE),
    appGroupStorage.GetItem(STORAGE_KEYS.USER_PREFERENCES),
    appGroupStorage.GetAllKeys(),
  ]);

  return {
    appGroupAvailable,
    widgetUpdaterAvailable,
    appGroupKeys: appGroupKeys.sort(),
    hasHealthData: HasValue(healthData),
    hasWidgetData: HasValue(widgetData),
    widgetDataChars: widgetData?.length ?? 0,
    hasWidgetPreferences: HasValue(widgetPreferences),
    hasUserPreferences: HasValue(userPreferences),
  };
};
