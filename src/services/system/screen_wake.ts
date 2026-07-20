import { NativeModules, Platform } from 'react-native';

interface ScreenWakeInterface {
  setKeepAwake(enabled: boolean): Promise<boolean>;
}

const { ScreenWake } = NativeModules;

/**
 * Screen Wake Service
 * Prevents the screen from auto-locking (which suspends the app) during
 * long-running foreground work such as the full health-data sync.
 */
class ScreenWakeService {
  private isIOS = Platform.OS === 'ios';
  private native: ScreenWakeInterface | null =
    this.isIOS && ScreenWake ? (ScreenWake as ScreenWakeInterface) : null;

  private async Set(enabled: boolean): Promise<void> {
    if (!this.native) return;
    try {
      await this.native.setKeepAwake(enabled);
    } catch (error) {
      // Non-critical: worst case the screen may lock during a long sync.
      console.warn('ScreenWake: failed to set keep-awake', error);
    }
  }

  /** Keep the screen on. Always pair with Release() in a finally block. */
  async Activate(): Promise<void> {
    await this.Set(true);
  }

  /** Restore normal auto-lock behavior. */
  async Release(): Promise<void> {
    await this.Set(false);
  }
}

export const screenWake = new ScreenWakeService();
