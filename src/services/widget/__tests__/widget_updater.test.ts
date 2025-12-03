import { widgetUpdater } from '../widget_updater';
import { NativeModules, Platform } from 'react-native';

// Mock NativeModules
jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  return {
    ...actualRN,
    NativeModules: {
      WidgetUpdater: {
        reloadAllTimelines: jest.fn(),
        reloadTimelines: jest.fn(),
        getAvailableWidgetKinds: jest.fn(),
      },
    },
    Platform: {
      OS: 'ios',
    },
  };
});

describe('WidgetUpdaterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IsAvailable', () => {
    it('should return true on iOS when WidgetUpdater is available', () => {
      const result = widgetUpdater.IsAvailable();
      expect(result).toBe(true);
    });

    it('should return false on Android', () => {
      (Platform.OS as any) = 'android';
      const result = widgetUpdater.IsAvailable();
      expect(result).toBe(false);
      // Reset for other tests
      (Platform.OS as any) = 'ios';
    });
  });

  describe('ReloadAllTimelines', () => {
    it('should reload all widget timelines when available', async () => {
      (
        NativeModules.WidgetUpdater.reloadAllTimelines as jest.Mock
      ).mockResolvedValue(true);

      await widgetUpdater.ReloadAllTimelines();

      expect(
        NativeModules.WidgetUpdater.reloadAllTimelines
      ).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when widget updater is not available', async () => {
      (Platform.OS as any) = 'android';

      await expect(widgetUpdater.ReloadAllTimelines()).resolves.not.toThrow();

      expect(
        NativeModules.WidgetUpdater.reloadAllTimelines
      ).not.toHaveBeenCalled();
      // Reset for other tests
      (Platform.OS as any) = 'ios';
    });

    it('should handle errors gracefully', async () => {
      (
        NativeModules.WidgetUpdater.reloadAllTimelines as jest.Mock
      ).mockRejectedValue(new Error('Widget update failed'));

      // Should not throw
      await expect(widgetUpdater.ReloadAllTimelines()).resolves.not.toThrow();
    });
  });

  describe('ReloadTimelines', () => {
    it('should reload specific widget timeline when available', async () => {
      (
        NativeModules.WidgetUpdater.reloadTimelines as jest.Mock
      ).mockResolvedValue(true);

      await widgetUpdater.ReloadTimelines('FitnessTrackerWidget');

      expect(NativeModules.WidgetUpdater.reloadTimelines).toHaveBeenCalledWith(
        'FitnessTrackerWidget'
      );
    });

    it('should use default widget kind when not specified', async () => {
      (
        NativeModules.WidgetUpdater.reloadTimelines as jest.Mock
      ).mockResolvedValue(true);

      await widgetUpdater.ReloadTimelines();

      expect(NativeModules.WidgetUpdater.reloadTimelines).toHaveBeenCalledWith(
        'FitnessTrackerWidget'
      );
    });

    it('should not throw error when widget updater is not available', async () => {
      (Platform.OS as any) = 'android';

      await expect(widgetUpdater.ReloadTimelines()).resolves.not.toThrow();

      expect(
        NativeModules.WidgetUpdater.reloadTimelines
      ).not.toHaveBeenCalled();
      // Reset for other tests
      (Platform.OS as any) = 'ios';
    });

    it('should handle errors gracefully', async () => {
      (
        NativeModules.WidgetUpdater.reloadTimelines as jest.Mock
      ).mockRejectedValue(new Error('Widget update failed'));

      await expect(widgetUpdater.ReloadTimelines()).resolves.not.toThrow();
    });
  });

  describe('GetAvailableWidgetKinds', () => {
    it('should get available widget kinds when available', async () => {
      (
        NativeModules.WidgetUpdater.getAvailableWidgetKinds as jest.Mock
      ).mockResolvedValue(['FitnessTrackerWidget']);

      const result = await widgetUpdater.GetAvailableWidgetKinds();

      expect(result).toEqual(['FitnessTrackerWidget']);
      expect(
        NativeModules.WidgetUpdater.getAvailableWidgetKinds
      ).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when widget updater is not available', async () => {
      (Platform.OS as any) = 'android';

      const result = await widgetUpdater.GetAvailableWidgetKinds();

      expect(result).toEqual([]);
      // Reset for other tests
      (Platform.OS as any) = 'ios';
    });

    it('should return empty array on error', async () => {
      (
        NativeModules.WidgetUpdater.getAvailableWidgetKinds as jest.Mock
      ).mockRejectedValue(new Error('Failed to get widget kinds'));

      const result = await widgetUpdater.GetAvailableWidgetKinds();

      expect(result).toEqual([]);
    });
  });
});
