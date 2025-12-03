import { appGroupStorage } from '../app_group_storage';
import { NativeModules, Platform } from 'react-native';

// Mock NativeModules
jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  return {
    ...actualRN,
    NativeModules: {
      AppGroupStorage: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        getAllKeys: jest.fn(),
        clear: jest.fn(),
        isAvailable: jest.fn(),
      },
    },
    Platform: {
      OS: 'ios',
    },
  };
});

describe('AppGroupStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the internal state
    (appGroupStorage as any).available = null;
    (appGroupStorage as any).storage = null;
  });

  describe('IsAvailable', () => {
    it('should return true when App Group storage is available on iOS', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        true
      );

      const result = await appGroupStorage.IsAvailable();
      expect(result).toBe(true);
      expect(NativeModules.AppGroupStorage.isAvailable).toHaveBeenCalledTimes(1);
    });

    it('should return false when App Group storage is not available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        false
      );

      const result = await appGroupStorage.IsAvailable();
      expect(result).toBe(false);
    });

    it('should cache availability result', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        true
      );

      await appGroupStorage.IsAvailable();
      await appGroupStorage.IsAvailable();

      // Should only be called once due to caching
      expect(NativeModules.AppGroupStorage.isAvailable).toHaveBeenCalledTimes(1);
    });
  });

  describe('SetItem', () => {
    it('should set item when storage is available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        true
      );
      (NativeModules.AppGroupStorage.setItem as jest.Mock).mockResolvedValue(
        true
      );

      await appGroupStorage.SetItem('test-key', 'test-value');
      expect(NativeModules.AppGroupStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        'test-value'
      );
    });

    it('should throw error when storage is not available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        false
      );

      await expect(
        appGroupStorage.SetItem('test-key', 'test-value')
      ).rejects.toThrow('App Group storage is not available');
    });
  });

  describe('GetItem', () => {
    it('should get item when storage is available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        true
      );
      (NativeModules.AppGroupStorage.getItem as jest.Mock).mockResolvedValue(
        'test-value'
      );

      const result = await appGroupStorage.GetItem('test-key');
      expect(result).toBe('test-value');
      expect(NativeModules.AppGroupStorage.getItem).toHaveBeenCalledWith(
        'test-key'
      );
    });

    it('should return null when storage is not available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        false
      );

      const result = await appGroupStorage.GetItem('test-key');
      expect(result).toBeNull();
    });

    it('should return null when item does not exist', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        true
      );
      (NativeModules.AppGroupStorage.getItem as jest.Mock).mockResolvedValue(
        null
      );

      const result = await appGroupStorage.GetItem('non-existent-key');
      expect(result).toBeNull();
    });
  });

  describe('RemoveItem', () => {
    it('should remove item when storage is available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        true
      );
      (NativeModules.AppGroupStorage.removeItem as jest.Mock).mockResolvedValue(
        true
      );

      await appGroupStorage.RemoveItem('test-key');
      expect(NativeModules.AppGroupStorage.removeItem).toHaveBeenCalledWith(
        'test-key'
      );
    });

    it('should throw error when storage is not available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        false
      );

      await expect(appGroupStorage.RemoveItem('test-key')).rejects.toThrow(
        'App Group storage is not available'
      );
    });
  });

  describe('GetAllKeys', () => {
    it('should get all keys when storage is available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        true
      );
      (NativeModules.AppGroupStorage.getAllKeys as jest.Mock).mockResolvedValue([
        'key1',
        'key2',
        'key3',
      ]);

      const result = await appGroupStorage.GetAllKeys();
      expect(result).toEqual(['key1', 'key2', 'key3']);
      expect(NativeModules.AppGroupStorage.getAllKeys).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when storage is not available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        false
      );

      const result = await appGroupStorage.GetAllKeys();
      expect(result).toEqual([]);
    });
  });

  describe('Clear', () => {
    it('should clear all items when storage is available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        true
      );
      (NativeModules.AppGroupStorage.clear as jest.Mock).mockResolvedValue(true);

      await appGroupStorage.Clear();
      expect(NativeModules.AppGroupStorage.clear).toHaveBeenCalledTimes(1);
    });

    it('should throw error when storage is not available', async () => {
      (NativeModules.AppGroupStorage.isAvailable as jest.Mock).mockResolvedValue(
        false
      );

      await expect(appGroupStorage.Clear()).rejects.toThrow(
        'App Group storage is not available'
      );
    });
  });
});

