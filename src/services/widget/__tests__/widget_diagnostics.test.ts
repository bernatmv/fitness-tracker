const LoadDiagnostics = async (overrides?: {
  appGroupAvailable?: boolean;
  appGroupKeys?: string[];
  healthData?: string | null;
  userPreferences?: string | null;
  widgetUpdaterAvailable?: boolean;
}) => {
  jest.resetModules();
  const hasOverride = <K extends keyof NonNullable<typeof overrides>>(
    key: K
  ): boolean => {
    return !!overrides && Object.prototype.hasOwnProperty.call(overrides, key);
  };

  const appGroupAvailable = overrides?.appGroupAvailable ?? true;
  const appGroupKeys = overrides?.appGroupKeys ?? [
    '@fitness_tracker:user_preferences',
    '@fitness_tracker:health_data',
  ];
  const healthData = hasOverride('healthData')
    ? overrides!.healthData
    : '{"lastFullSync":"2024-01-01T00:00:00Z"}';
  const userPreferences = hasOverride('userPreferences')
    ? overrides!.userPreferences
    : '{"language":"en","theme":"system"}';
  const widgetUpdaterAvailable = overrides?.widgetUpdaterAvailable ?? true;

  jest.doMock('@services/storage/app_group_storage', () => ({
    appGroupStorage: {
      IsAvailable: jest.fn().mockResolvedValue(appGroupAvailable),
      GetAllKeys: jest.fn().mockResolvedValue(appGroupKeys),
      GetItem: jest.fn((key: string) => {
        if (key === '@fitness_tracker:health_data') return Promise.resolve(healthData);
        if (key === '@fitness_tracker:user_preferences') return Promise.resolve(userPreferences);
        return Promise.resolve(null);
      }),
    },
  }));

  jest.doMock('../widget_updater', () => ({
    widgetUpdater: {
      IsAvailable: jest.fn().mockReturnValue(widgetUpdaterAvailable),
    },
  }));

  // Use require() (CommonJS) to match the current Jest setup (no ESM/vm-modules).
  const { GetWidgetDiagnostics } = require('../widget_diagnostics') as typeof import('../widget_diagnostics');
  const { appGroupStorage } = require('@services/storage/app_group_storage') as typeof import('@services/storage/app_group_storage');
  const { widgetUpdater } = require('../widget_updater') as typeof import('../widget_updater');

  return { GetWidgetDiagnostics, appGroupStorage, widgetUpdater };
};

describe('GetWidgetDiagnostics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return availability and key presence flags', async () => {
    const { GetWidgetDiagnostics, appGroupStorage, widgetUpdater } =
      await LoadDiagnostics();

    const result = await GetWidgetDiagnostics();

    expect(result.appGroupAvailable).toBe(true);
    expect(result.widgetUpdaterAvailable).toBe(true);
    expect(result.hasHealthData).toBe(true);
    expect(result.hasUserPreferences).toBe(true);
    expect(result.appGroupKeys).toEqual([
      '@fitness_tracker:health_data',
      '@fitness_tracker:user_preferences',
    ]);

    expect(appGroupStorage.IsAvailable).toHaveBeenCalledTimes(1);
    expect(widgetUpdater.IsAvailable).toHaveBeenCalledTimes(1);
  });

  it('should return false for missing values', async () => {
    const { GetWidgetDiagnostics } = await LoadDiagnostics({
      healthData: null,
      userPreferences: '',
      appGroupKeys: [],
    });

    const result = await GetWidgetDiagnostics();

    expect(result.hasHealthData).toBe(false);
    expect(result.hasUserPreferences).toBe(false);
    expect(result.appGroupKeys).toEqual([]);
  });
});


