import { NativeModules, Platform } from 'react-native';

interface WidgetUpdaterInterface {
  reloadAllTimelines(): Promise<boolean>;
}

const { WidgetUpdater } = NativeModules;

/**
 * Widget Updater Service
 * Provides functionality to reload widget timelines when data changes
 */
class WidgetUpdaterService {
  private isIOS = Platform.OS === 'ios';
  private updater: WidgetUpdaterInterface | null = null;

  constructor() {
    if (this.isIOS) {
      if (WidgetUpdater) {
        this.updater = WidgetUpdater as WidgetUpdaterInterface;
      }
      // Note: If WidgetUpdater is undefined, it means the native module isn't loaded.
      // This is OK - widgets will still work, they just won't auto-refresh when data changes.
      // To enable auto-refresh, ensure WidgetUpdater.swift is included in the Xcode project.
    }
  }

  /**
   * Check if widget updates are available
   */
  IsAvailable(): boolean {
    if (!this.isIOS) {
      return false;
    }

    // Check if native module is available
    if (!this.updater) {
      // Try to initialize it again (in case it wasn't available at construction time)
      if (WidgetUpdater) {
        this.updater = WidgetUpdater as WidgetUpdaterInterface;
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Reload all widget timelines
   * This will cause all widgets to refresh and show the latest data
   */
  async ReloadAllTimelines(): Promise<void> {
    if (!this.isIOS) {
      // Silently skip on non-iOS platforms
      return;
    }

    if (!this.updater) {
      console.warn(
        'WidgetUpdater: Native module not available. Widgets will not auto-refresh.'
      );
      // Widget updater not available - widgets won't auto-refresh but will still work
      // This is non-critical, so we silently skip
      return;
    }

    try {
      console.log('WidgetUpdater: Reloading all widget timelines...');
      await this.updater.reloadAllTimelines();
      console.log('WidgetUpdater: Successfully reloaded all widget timelines');
    } catch (error) {
      console.error('WidgetUpdater: Error reloading widget timelines:', error);
      // Don't throw - widget updates are non-critical
    }
  }
}

export const widgetUpdater = new WidgetUpdaterService();
