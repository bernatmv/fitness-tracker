describe('screenWake', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const load = (os: 'ios' | 'android', hasNative: boolean) => {
    jest.doMock('react-native', () => ({
      Platform: { OS: os },
      NativeModules: hasNative
        ? { ScreenWake: { setKeepAwake: jest.fn().mockResolvedValue(true) } }
        : {},
    }));
    const { screenWake } =
      require('../screen_wake') as typeof import('../screen_wake');
    const { NativeModules } =
      require('react-native') as typeof import('react-native');
    return { screenWake, NativeModules };
  };

  it('calls the native module on iOS when available', async () => {
    const { screenWake, NativeModules } = load('ios', true);
    await screenWake.Activate();
    await screenWake.Release();
    const mod = (NativeModules as { ScreenWake: { setKeepAwake: jest.Mock } })
      .ScreenWake;
    expect(mod.setKeepAwake).toHaveBeenNthCalledWith(1, true);
    expect(mod.setKeepAwake).toHaveBeenNthCalledWith(2, false);
  });

  it('is a no-op on Android', async () => {
    const { screenWake } = load('android', false);
    await expect(screenWake.Activate()).resolves.toBeUndefined();
    await expect(screenWake.Release()).resolves.toBeUndefined();
  });

  it('does not throw when the native module is missing on iOS', async () => {
    const { screenWake } = load('ios', false);
    await expect(screenWake.Activate()).resolves.toBeUndefined();
  });
});
