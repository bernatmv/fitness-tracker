import React from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { DARK_THEME } from '@constants';
import { RequestHealthPermissions } from '@services/health_data';
import { SaveUserPreferences } from '@services/storage';
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

const MockedRequestHealthPermissions =
  RequestHealthPermissions as jest.MockedFunction<
    typeof RequestHealthPermissions
  >;

/** Advances from the welcome step to the health permissions step */
const RenderOnPermissionsStep = (onComplete = jest.fn()) => {
  const utils = render(<OnboardingScreen onComplete={onComplete} />);
  fireEvent.press(utils.getByText('common.continue'));
  return utils;
};

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedRequestHealthPermissions.mockResolvedValue(true);
  });

  it('uses readable dark-theme colors on the health permissions step', () => {
    const { getByText, UNSAFE_getByType } = RenderOnPermissionsStep();

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
  });

  // App Store guideline 5.1.1(iv): the primer must not offer a way to dodge the
  // system permission prompt, and its button must not push the user to consent
  it('offers no way to skip the permission request', () => {
    const { getByText, queryByText } = RenderOnPermissionsStep();

    expect(queryByText('common.skip')).toBeNull();
    expect(queryByText('onboarding.permissions_button')).toBeNull();
    expect(getByText('common.continue')).toBeTruthy();
  });

  it('requests health permissions when continuing from the primer', async () => {
    const { getByText } = RenderOnPermissionsStep();

    fireEvent.press(getByText('common.continue'));

    await waitFor(() =>
      expect(MockedRequestHealthPermissions).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(getByText('onboarding.setup_complete')).toBeTruthy()
    );
    expect(SaveUserPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingCompleted: true,
        permissionsGranted: true,
      })
    );
  });

  it('completes onboarding and links to Settings when permission is denied', async () => {
    const openSettings = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue(undefined);
    MockedRequestHealthPermissions.mockResolvedValue(false);

    const { getByText } = RenderOnPermissionsStep();

    fireEvent.press(getByText('common.continue'));

    await waitFor(() =>
      expect(
        getByText('onboarding.permissions_denied_description')
      ).toBeTruthy()
    );
    expect(SaveUserPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingCompleted: true,
        permissionsGranted: false,
      })
    );

    fireEvent.press(getByText('common.open_settings'));
    expect(openSettings).toHaveBeenCalled();
  });
});
