import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { DARK_THEME } from '@constants';
import { OnboardingScreen } from '../OnboardingScreen';

jest.mock(
  '@react-native-community/blur',
  () => ({ BlurView: require('react-native').View }),
  { virtual: true }
);

jest.mock('@utils', () => ({
  ...jest.requireActual('@utils'),
  useAppTheme: () => jest.requireActual('@constants').DARK_THEME,
}));

jest.mock('@services/health_data', () => ({
  RequestHealthPermissions: jest.fn(),
}));

jest.mock('@services/storage', () => ({
  SaveUserPreferences: jest.fn(),
}));

jest.mock('@services/sync', () => ({
  SyncAllDataFromAllTime: jest.fn(),
}));

describe('OnboardingScreen', () => {
  it('uses readable dark-theme colors on the health permissions step', () => {
    const { getByText, UNSAFE_getByType } = render(
      <OnboardingScreen onComplete={jest.fn()} />
    );

    fireEvent.press(getByText('common.continue'));

    expect(
      StyleSheet.flatten(getByText('onboarding.permissions_title').props.style)
        .color
    ).toBe(DARK_THEME.colors.text.primary);
    expect(
      StyleSheet.flatten(
        getByText('onboarding.permissions_description').props.style
      ).color
    ).toBe(DARK_THEME.colors.text.secondary);
    expect(
      StyleSheet.flatten(UNSAFE_getByType(ScrollView).props.style)
        .backgroundColor
    ).toBe(DARK_THEME.colors.background);
    expect(StyleSheet.flatten(getByText('common.skip').props.style).color).toBe(
      DARK_THEME.colors.link
    );
  });
});
