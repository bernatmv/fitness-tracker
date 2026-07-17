const LoadWidgetUpdater = (os: 'ios' | 'android') => {
  jest.resetModules();
  jest.doMock('react-native', () => ({
    NativeModules: {
      WidgetUpdater: {
        reloadAllTimelines: jest.fn(),
      },
    },
    Platform: { OS: os },
  }));

  const { widgetUpdater } =
    require('../widget_updater') as typeof import('../widget_updater');
  const { NativeModules, Platform } =
    require('react-native') as typeof import('react-native');
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
});
