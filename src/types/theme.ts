/**
 * Theme color definitions
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  border: string;
  divider: string;
  /** Card background color */
  cardBackground: string;
  /** Stat card background color */
  statCardBackground: string;
  /** Activity wall label color */
  activityLabel: string;
  /** Selected cell border color */
  cellSelectedBorder: string;
  /** Link/icon color */
  link: string;
  /** GitHub-like activity colors (default green) */
  activityDefault: {
    level0: string; // No activity
    level1: string; // Low activity
    level2: string; // Medium activity
    level3: string; // High activity
    level4: string; // Very high activity
  };
}

/**
 * Theme spacing scale
 */
export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

/**
 * Theme typography
 */
export interface ThemeTypography {
  h1: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  h2: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  h3: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  body: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  caption: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
}

/**
 * Complete theme definition
 */
export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
}

