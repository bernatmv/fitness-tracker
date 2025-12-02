import { Theme } from '@types';

/**
 * Light theme configuration
 */
export const LIGHT_THEME: Theme = {
  mode: 'light',
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5AC8FA',
    text: {
      primary: '#000000',
      secondary: '#3C3C43',
      disabled: '#C7C7CC',
      inverse: '#FFFFFF',
    },
    border: '#C6C6C8',
    divider: '#E5E5EA',
    cardBackground: '#FFFFFF',
    statCardBackground: '#F2F2F7',
    activityLabel: '#8E8E93',
    cellSelectedBorder: '#F4C430',
    link: '#007AFF',
    activityDefault: {
      level0: '#ebedf0',
      level1: '#9be9a8',
      level2: '#40c463',
      level3: '#30a14e',
      level4: '#216e39',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 34,
      fontWeight: '700',
      lineHeight: 41,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 34,
    },
    h3: {
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 22,
    },
    caption: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
    },
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
  },
};

/**
 * Dark theme configuration
 */
export const DARK_THEME: Theme = {
  mode: 'dark',
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#0d1117',
    surface: '#1C1C1E',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    info: '#64D2FF',
    text: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      disabled: '#48484A',
      inverse: '#000000',
    },
    border: '#38383A',
    divider: '#2C2C2E',
    cardBackground: '#0d1117',
    statCardBackground: '#2C2C2E',
    activityLabel: '#8E8E93',
    cellSelectedBorder: '#FFD60A',
    link: '#0A84FF',
    activityDefault: {
      level0: '#161b22',
      level1: '#0e4429',
      level2: '#006d32',
      level3: '#26a641',
      level4: '#39d353',
    },
  },
  spacing: LIGHT_THEME.spacing,
  typography: LIGHT_THEME.typography,
  borderRadius: LIGHT_THEME.borderRadius,
};

