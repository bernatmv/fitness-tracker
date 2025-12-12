import { HealthDataStore, UserPreferences, MetricType } from '@types';

// Mock app group storage with stable API across module reloads
jest.mock('../app_group_storage', () => ({
  appGroupStorage: {
    IsAvailable: jest.fn(),
    SetItem: jest.fn(),
    GetItem: jest.fn(),
    RemoveItem: jest.fn(),
    GetAllKeys: jest.fn(),
    Clear: jest.fn(),
  },
}));

describe('Storage Service with App Group', () => {
  const LoadModules = () => {
    // storage_service caches an internal adapter; reset between tests so availability changes apply
    jest.resetModules();
    const AsyncStorage = require('@react-native-async-storage/async-storage') as typeof import('@react-native-async-storage/async-storage');
    const storageService = require('../storage_service') as typeof import('../storage_service');
    const { appGroupStorage } = require('../app_group_storage') as typeof import('../app_group_storage');
    return { AsyncStorage, storageService, appGroupStorage };
  };

  const mockHealthData: HealthDataStore = {
    metrics: {},
    exercises: [],
    lastFullSync: new Date('2024-01-01T00:00:00Z'),
  };

  const mockPreferences: UserPreferences = {
    language: 'en',
    dateFormat: 'MM/dd/yyyy',
    theme: 'system',
    metricConfigs: {} as any,
    widgets: [],
    syncConfig: {
      strategy: 'HYBRID' as any,
    },
    onboardingCompleted: true,
    permissionsGranted: true,
    enableMultiRowLayout: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SaveHealthData', () => {
    it('should use App Group storage when available', async () => {
      const { AsyncStorage, storageService, appGroupStorage } = LoadModules();
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(true);
      (appGroupStorage.SetItem as jest.Mock).mockResolvedValue(undefined);

      await storageService.SaveHealthData(mockHealthData);

      expect(appGroupStorage.SetItem).toHaveBeenCalledWith(
        '@fitness_tracker:health_data',
        expect.stringContaining('"lastFullSync"')
      );
      // When App Group is used, we also write to AsyncStorage as a non-critical backup.
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fitness_tracker:health_data',
        expect.stringContaining('"lastFullSync"')
      );
    });

    it('should fall back to AsyncStorage when App Group is not available', async () => {
      const { AsyncStorage, storageService, appGroupStorage } = LoadModules();
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(false);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await storageService.SaveHealthData(mockHealthData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fitness_tracker:health_data',
        expect.stringContaining('"lastFullSync"')
      );
    });
  });

  describe('LoadHealthData', () => {
    it('should load from App Group storage when available', async () => {
      const { AsyncStorage, storageService, appGroupStorage } = LoadModules();
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(true);
      const jsonData = JSON.stringify(mockHealthData);
      (appGroupStorage.GetItem as jest.Mock).mockResolvedValue(jsonData);

      const result = await storageService.LoadHealthData();

      expect(result).toBeDefined();
      expect(result?.lastFullSync).toBeInstanceOf(Date);
      expect(appGroupStorage.GetItem).toHaveBeenCalledWith(
        '@fitness_tracker:health_data'
      );
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should fall back to AsyncStorage when App Group is not available', async () => {
      const { AsyncStorage, storageService, appGroupStorage } = LoadModules();
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(false);
      const jsonData = JSON.stringify(mockHealthData);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(jsonData);

      const result = await storageService.LoadHealthData();

      expect(result).toBeDefined();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@fitness_tracker:health_data'
      );
    });

    it('should return null when data does not exist', async () => {
      const { storageService, appGroupStorage } = LoadModules();
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(true);
      (appGroupStorage.GetItem as jest.Mock).mockResolvedValue(null);

      const result = await storageService.LoadHealthData();

      expect(result).toBeNull();
    });
  });

  describe('SaveUserPreferences', () => {
    it('should use App Group storage when available', async () => {
      const { AsyncStorage, storageService, appGroupStorage } = LoadModules();
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(true);
      (appGroupStorage.SetItem as jest.Mock).mockResolvedValue(undefined);

      await storageService.SaveUserPreferences(mockPreferences);

      expect(appGroupStorage.SetItem).toHaveBeenCalledWith(
        '@fitness_tracker:user_preferences',
        expect.stringContaining('"language"')
      );
      // When App Group is used, we also write to AsyncStorage as a non-critical backup.
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fitness_tracker:user_preferences',
        expect.stringContaining('"language"')
      );
    });

    it('should fall back to AsyncStorage when App Group is not available', async () => {
      const { AsyncStorage, storageService, appGroupStorage } = LoadModules();
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(false);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await storageService.SaveUserPreferences(mockPreferences);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fitness_tracker:user_preferences',
        expect.stringContaining('"language"')
      );
    });
  });

  describe('LoadUserPreferences', () => {
    it('should load from App Group storage when available', async () => {
      const { AsyncStorage, storageService, appGroupStorage } = LoadModules();
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(true);
      const jsonData = JSON.stringify(mockPreferences);
      (appGroupStorage.GetItem as jest.Mock).mockResolvedValue(jsonData);

      const result = await storageService.LoadUserPreferences();

      expect(result).toBeDefined();
      expect(result?.language).toBe('en');
      expect(appGroupStorage.GetItem).toHaveBeenCalledWith(
        '@fitness_tracker:user_preferences'
      );
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should fall back to AsyncStorage when App Group is not available', async () => {
      const { AsyncStorage, storageService, appGroupStorage } = LoadModules();
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(false);
      const jsonData = JSON.stringify(mockPreferences);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(jsonData);

      const result = await storageService.LoadUserPreferences();

      expect(result).toBeDefined();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@fitness_tracker:user_preferences'
      );
    });
  });
});
