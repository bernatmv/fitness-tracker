import { Appearance, ColorSchemeName } from 'react-native';
import { useTheme as useRNEUITheme } from '@rneui/themed';
import { Theme, ThemePreference } from '@types';
import { LIGHT_THEME, DARK_THEME } from '@constants';

/**
 * Get the current system color scheme
 */
export const GetSystemColorScheme = (): 'light' | 'dark' => {
  const colorScheme: ColorSchemeName = Appearance.getColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
};

/**
 * Get the effective theme based on preference and system setting
 */
export const GetEffectiveTheme = (
  preference: ThemePreference
): 'light' | 'dark' => {
  if (preference === 'system') {
    return GetSystemColorScheme();
  }
  return preference;
};

/**
 * Get the theme object based on preference
 */
export const GetTheme = (preference: ThemePreference): Theme => {
  const effectiveTheme = GetEffectiveTheme(preference);
  return effectiveTheme === 'dark' ? DARK_THEME : LIGHT_THEME;
};

/**
 * Custom hook to access our app theme
 * Extracts the custom theme from RNEUI's theme provider
 */
export const useAppTheme = (): Theme => {
  const { theme: rneuiTheme } = useRNEUITheme();
  // RNEUI stores our custom theme in the theme prop
  return rneuiTheme as unknown as Theme;
};
