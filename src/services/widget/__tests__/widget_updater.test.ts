const LoadWidgetUpdater = (os: 'ios' | 'android') => {
  jest.resetModules();
  jest.doMock('react-native', () => ({
    NativeModules: {
      WidgetUpdater: {
        reloadAllTimelines: jest.fn(),
        reloadTimelines: jest.fn(),
        getAvailableWidgetKinds: jest.fn(),
      },
    },
    Platform: { OS: os },
  }));

  const { widgetUpdater } = require('../widget_updater') as typeof import('../widget_updater');
  const { NativeModules, Platform } = require('react-native') as typeof import('react-native');
  return { widgetUpdater, NativeModules, Platform };
};

describe('WidgetUpdaterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IsAvailable', () => {
    it('should return true on iOS when WidgetUpdater is available', () => {
      const { widgetUpdater } = LoadWidgetUpdater('ios');
      const result = widgetUpdater.IsAvailable();
      expect(result).toBe(true);
    });

    it('should return false on Android', () => {
      const { widgetUpdater } = LoadWidgetUpdater('android');
      const result = widgetUpdater.IsAvailable();
      expect(result).toBe(false);
    });
  });

  describe('ReloadAllTimelines', () => {
    it('should reload all widget timelines when available', async () => {
      const { widgetUpdater, NativeModules } = LoadWidgetUpdater('ios');
      (
        NativeModules.WidgetUpdater.reloadAllTimelines as jest.Mock
      ).mockResolvedValue(true);

      await widgetUpdater.ReloadAllTimelines();

      expect(
        NativeModules.WidgetUpdater.reloadAllTimelines
      ).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when widget updater is not available', async () => {
      const { widgetUpdater, NativeModules } = LoadWidgetUpdater('android');

      await expect(widgetUpdater.ReloadAllTimelines()).resolves.not.toThrow();

      expect(
        NativeModules.WidgetUpdater.reloadAllTimelines
      ).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { widgetUpdater, NativeModules } = LoadWidgetUpdater('ios');
      (
        NativeModules.WidgetUpdater.reloadAllTimelines as jest.Mock
      ).mockRejectedValue(new Error('Widget update failed'));

      // Should not throw
      await expect(widgetUpdater.ReloadAllTimelines()).resolves.not.toThrow();
    });
  });

  describe('ReloadTimelines', () => {
    it('should reload specific widget timeline when available', async () => {
      const { widgetUpdater, NativeModules } = LoadWidgetUpdater('ios');
      (
        NativeModules.WidgetUpdater.reloadTimelines as jest.Mock
      ).mockResolvedValue(true);

      await widgetUpdater.ReloadTimelines('FitnessTrackerWidget');

      expect(NativeModules.WidgetUpdater.reloadTimelines).toHaveBeenCalledWith(
        'FitnessTrackerWidget'
      );
    });

    it('should use default widget kind when not specified', async () => {
      const { widgetUpdater, NativeModules } = LoadWidgetUpdater('ios');
      (
        NativeModules.WidgetUpdater.reloadTimelines as jest.Mock
      ).mockResolvedValue(true);

      await widgetUpdater.ReloadTimelines();

      expect(NativeModules.WidgetUpdater.reloadTimelines).toHaveBeenCalledWith(
        'FitnessTrackerWidget'
      );
    });

    it('should not throw error when widget updater is not available', async () => {
      const { widgetUpdater, NativeModules } = LoadWidgetUpdater('android');

      await expect(widgetUpdater.ReloadTimelines()).resolves.not.toThrow();

      expect(
        NativeModules.WidgetUpdater.reloadTimelines
      ).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { widgetUpdater, NativeModules } = LoadWidgetUpdater('ios');
      (
        NativeModules.WidgetUpdater.reloadTimelines as jest.Mock
      ).mockRejectedValue(new Error('Widget update failed'));

      await expect(widgetUpdater.ReloadTimelines()).resolves.not.toThrow();
    });
  });

  describe('GetAvailableWidgetKinds', () => {
    it('should get available widget kinds when available', async () => {
      const { widgetUpdater, NativeModules } = LoadWidgetUpdater('ios');
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
      const { widgetUpdater } = LoadWidgetUpdater('android');

      const result = await widgetUpdater.GetAvailableWidgetKinds();

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      const { widgetUpdater, NativeModules } = LoadWidgetUpdater('ios');
      (
        NativeModules.WidgetUpdater.getAvailableWidgetKinds as jest.Mock
      ).mockRejectedValue(new Error('Failed to get widget kinds'));

      const result = await widgetUpdater.GetAvailableWidgetKinds();

      expect(result).toEqual([]);
    });
  });
});
