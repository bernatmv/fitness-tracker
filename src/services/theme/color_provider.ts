import { GetPaletteColorsById } from '@constants';
import { MetricType } from '@types';

/**
 * Get colors for a metric based on palette ID and theme mode
 */
export const GetMetricColors = (
  paletteId: string,
  mode: 'light' | 'dark'
): string[] => {
  return GetPaletteColorsById(paletteId, mode);
};

/**
 * Get colors for a metric config based on current theme mode
 */
export const GetColorsForMetricConfig = (
  paletteId: string,
  isDarkMode: boolean
): string[] => {
  const mode = isDarkMode ? 'dark' : 'light';
  return GetMetricColors(paletteId, mode);
};

