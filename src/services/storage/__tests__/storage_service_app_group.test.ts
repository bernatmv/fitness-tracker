import AsyncStorage from '@react-native-async-storage/async-storage';
import { SaveHealthData, LoadHealthData, SaveUserPreferences, LoadUserPreferences } from '../storage_service';
import { appGroupStorage } from '../app_group_storage';
import { HealthDataStore, UserPreferences, MetricType } from '@types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../app_group_storage');

describe('Storage Service with App Group', () => {
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
    (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(true);
  });

  describe('SaveHealthData', () => {
    it('should use App Group storage when available', async () => {
      (appGroupStorage.SetItem as jest.Mock).mockResolvedValue(undefined);

      await SaveHealthData(mockHealthData);

      expect(appGroupStorage.SetItem).toHaveBeenCalledWith(
        '@fitness_tracker:health_data',
        expect.stringContaining('"lastFullSync"')
      );
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should fall back to AsyncStorage when App Group is not available', async () => {
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(false);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await SaveHealthData(mockHealthData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fitness_tracker:health_data',
        expect.stringContaining('"lastFullSync"')
      );
    });
  });

  describe('LoadHealthData', () => {
    it('should load from App Group storage when available', async () => {
      const jsonData = JSON.stringify(mockHealthData);
      (appGroupStorage.GetItem as jest.Mock).mockResolvedValue(jsonData);

      const result = await LoadHealthData();

      expect(result).toBeDefined();
      expect(result?.lastFullSync).toBeInstanceOf(Date);
      expect(appGroupStorage.GetItem).toHaveBeenCalledWith(
        '@fitness_tracker:health_data'
      );
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should fall back to AsyncStorage when App Group is not available', async () => {
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(false);
      const jsonData = JSON.stringify(mockHealthData);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(jsonData);

      const result = await LoadHealthData();

      expect(result).toBeDefined();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@fitness_tracker:health_data'
      );
    });

    it('should return null when data does not exist', async () => {
      (appGroupStorage.GetItem as jest.Mock).mockResolvedValue(null);

      const result = await LoadHealthData();

      expect(result).toBeNull();
    });
  });

  describe('SaveUserPreferences', () => {
    it('should use App Group storage when available', async () => {
      (appGroupStorage.SetItem as jest.Mock).mockResolvedValue(undefined);

      await SaveUserPreferences(mockPreferences);

      expect(appGroupStorage.SetItem).toHaveBeenCalledWith(
        '@fitness_tracker:user_preferences',
        expect.stringContaining('"language"')
      );
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should fall back to AsyncStorage when App Group is not available', async () => {
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(false);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await SaveUserPreferences(mockPreferences);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fitness_tracker:user_preferences',
        expect.stringContaining('"language"')
      );
    });
  });

  describe('LoadUserPreferences', () => {
    it('should load from App Group storage when available', async () => {
      const jsonData = JSON.stringify(mockPreferences);
      (appGroupStorage.GetItem as jest.Mock).mockResolvedValue(jsonData);

      const result = await LoadUserPreferences();

      expect(result).toBeDefined();
      expect(result?.language).toBe('en');
      expect(appGroupStorage.GetItem).toHaveBeenCalledWith(
        '@fitness_tracker:user_preferences'
      );
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should fall back to AsyncStorage when App Group is not available', async () => {
      (appGroupStorage.IsAvailable as jest.Mock).mockResolvedValue(false);
      const jsonData = JSON.stringify(mockPreferences);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(jsonData);

      const result = await LoadUserPreferences();

      expect(result).toBeDefined();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@fitness_tracker:user_preferences'
      );
    });
  });
});

