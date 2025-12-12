// Jest global mocks for native modules that are unavailable in the Jest runtime.
// Keep this file small and focused (only test-environment shims).

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-localize', () => ({
  getLocales: () => [
    {
      languageTag: 'en-US',
      languageCode: 'en',
      countryCode: 'US',
      isRTL: false,
    },
  ],
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Keep it simple: for tests, return keys as-is.
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: () => Promise.resolve(),
    },
  }),
}));

jest.mock('@rneui/themed', () => {
  const actual = jest.requireActual('@rneui/themed');
  const { LIGHT_THEME } = require('./src/constants/theme');
  return {
    ...actual,
    useTheme: () => ({ theme: LIGHT_THEME }),
  };
});


