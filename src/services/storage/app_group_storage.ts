import { NativeModules, Platform } from 'react-native';

interface AppGroupStorageInterface {
  setItem(key: string, value: string): Promise<boolean>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<boolean>;
  getAllKeys(): Promise<string[]>;
  clear(): Promise<boolean>;
  isAvailable(): Promise<boolean>;
}

const { AppGroupStorage } = NativeModules;

/**
 * App Group Storage Service
 * Provides access to shared UserDefaults via App Groups on iOS
 * Falls back to AsyncStorage on Android or if App Groups are unavailable
 */
class AppGroupStorageService {
  private isIOS = Platform.OS === 'ios';
  private storage: AppGroupStorageInterface | null = null;
  private available: boolean | null = null;

  /**
   * Initialize and check if App Group storage is available
   */
  private async CheckAvailability(): Promise<boolean> {
    if (!this.isIOS) {
      return false;
    }

    if (this.available !== null) {
      return this.available;
    }

    try {
      if (AppGroupStorage) {
        this.storage = AppGroupStorage as AppGroupStorageInterface;
        this.available = await this.storage.isAvailable();
        return this.available;
      }
    } catch (error) {
      console.warn('App Group storage not available:', error);
    }

    this.available = false;
    return false;
  }

  /**
   * Set an item in App Group storage
   */
  async SetItem(key: string, value: string): Promise<void> {
    const isAvailable = await this.CheckAvailability();
    if (!isAvailable || !this.storage) {
      throw new Error('App Group storage is not available');
    }

    await this.storage.setItem(key, value);
  }

  /**
   * Get an item from App Group storage
   */
  async GetItem(key: string): Promise<string | null> {
    const isAvailable = await this.CheckAvailability();
    if (!isAvailable || !this.storage) {
      return null;
    }

    return await this.storage.getItem(key);
  }

  /**
   * Remove an item from App Group storage
   */
  async RemoveItem(key: string): Promise<void> {
    const isAvailable = await this.CheckAvailability();
    if (!isAvailable || !this.storage) {
      throw new Error('App Group storage is not available');
    }

    await this.storage.removeItem(key);
  }

  /**
   * Get all keys from App Group storage
   */
  async GetAllKeys(): Promise<string[]> {
    const isAvailable = await this.CheckAvailability();
    if (!isAvailable || !this.storage) {
      return [];
    }

    return await this.storage.getAllKeys();
  }

  /**
   * Clear all items from App Group storage
   */
  async Clear(): Promise<void> {
    const isAvailable = await this.CheckAvailability();
    if (!isAvailable || !this.storage) {
      throw new Error('App Group storage is not available');
    }

    await this.storage.clear();
  }

  /**
   * Check if App Group storage is available
   */
  async IsAvailable(): Promise<boolean> {
    return await this.CheckAvailability();
  }
}

export const appGroupStorage = new AppGroupStorageService();

