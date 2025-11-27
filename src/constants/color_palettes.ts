/**
 * Color palette definitions for activity visualization
 * Each palette contains 5 colors that represent increasing intensity levels
 */

export interface ColorPalette {
  /** Unique identifier for the palette */
  id: string;
  /** Display name for the palette */
  name: string;
  /** Array of 5 colors from lightest to darkest (hex format) */
  colors: [string, string, string, string, string];
  /** Base color for generating shades */
  baseColor: string;
}

/**
 * Collection of available color palettes
 */
export const COLOR_PALETTES: Record<string, ColorPalette> = {
  // Current palettes from default config
  github_green: {
    id: 'github_green',
    name: 'GitHub Green',
    colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    baseColor: '#40c463',
  },
  ios_health_red: {
    id: 'ios_health_red',
    name: 'iOS Health Red',
    colors: ['#f4e4e1', '#f9b8b2', '#f9827c', '#e74c3c', '#c0392b'],
    baseColor: '#e74c3c',
  },
  ios_health_green: {
    id: 'ios_health_green',
    name: 'iOS Health Green',
    colors: ['#e6f9ea', '#bdf6d8', '#7cefa1', '#34c759', '#1eae4a'],
    baseColor: '#34c759',
  },
  ios_health_blue: {
    id: 'ios_health_blue',
    name: 'iOS Health Blue',
    colors: ['#e6f2fa', '#b3dbf7', '#6ec1f6', '#007aff', '#004a99'],
    baseColor: '#6ec1f6',
  },
  ios_health_purple: {
    id: 'ios_health_purple',
    name: 'iOS Health Purple',
    colors: ['#f3e8ff', '#d1b3ff', '#a580e8', '#8e44ad', '#5e3370'],
    baseColor: '#8e44ad',
  },

  // Additional stylish palettes
  ocean_blue: {
    id: 'ocean_blue',
    name: 'Ocean Blue',
    colors: ['#e0f2fe', '#b3e5fc', '#4fc3f7', '#0288d1', '#01579b'],
    baseColor: '#0288d1',
  },
  sunset_orange: {
    id: 'sunset_orange',
    name: 'Sunset Orange',
    colors: ['#fff3e0', '#ffe0b2', '#ffb74d', '#ff9800', '#e65100'],
    baseColor: '#ff9800',
  },
  forest_green: {
    id: 'forest_green',
    name: 'Forest Green',
    colors: ['#e8f5e9', '#c8e6c9', '#81c784', '#4caf50', '#2e7d32'],
    baseColor: '#4caf50',
  },
  lavender_purple: {
    id: 'lavender_purple',
    name: 'Lavender Purple',
    colors: ['#f3e5f5', '#e1bee7', '#ba68c8', '#9c27b0', '#6a1b9a'],
    baseColor: '#9c27b0',
  },
  monochrome_gray: {
    id: 'monochrome_gray',
    name: 'Monochrome Gray',
    colors: ['#f5f5f5', '#e0e0e0', '#9e9e9e', '#616161', '#212121'],
    baseColor: '#616161',
  },
  fire_red: {
    id: 'fire_red',
    name: 'Fire Red',
    colors: ['#ffebee', '#ffcdd2', '#ef5350', '#d32f2f', '#b71c1c'],
    baseColor: '#d32f2f',
  },
  tropical_teal: {
    id: 'tropical_teal',
    name: 'Tropical Teal',
    colors: ['#e0f7fa', '#b2ebf2', '#26c6da', '#00acc1', '#00838f'],
    baseColor: '#00acc1',
  },
  amber_gold: {
    id: 'amber_gold',
    name: 'Amber Gold',
    colors: ['#fff8e1', '#ffecb3', '#ffc107', '#ffa000', '#ff6f00'],
    baseColor: '#ffc107',
  },
  emerald_green: {
    id: 'emerald_green',
    name: 'Emerald Green',
    colors: ['#e8f5e9', '#a5d6a7', '#66bb6a', '#43a047', '#2e7d32'],
    baseColor: '#43a047',
  },
  deep_purple: {
    id: 'deep_purple',
    name: 'Deep Purple',
    colors: ['#ede7f6', '#d1c4e9', '#9575cd', '#673ab7', '#4527a0'],
    baseColor: '#673ab7',
  },
  rose_pink: {
    id: 'rose_pink',
    name: 'Rose Pink',
    colors: ['#fce4ec', '#f8bbd0', '#f48fb1', '#e91e63', '#c2185b'],
    baseColor: '#e91e63',
  },
  cyan_blue: {
    id: 'cyan_blue',
    name: 'Cyan Blue',
    colors: ['#e0f7fa', '#b2ebf2', '#4dd0e1', '#00bcd4', '#0097a7'],
    baseColor: '#00bcd4',
  },
  indigo_night: {
    id: 'indigo_night',
    name: 'Indigo Night',
    colors: ['#e8eaf6', '#c5cae9', '#7986cb', '#3f51b5', '#283593'],
    baseColor: '#3f51b5',
  },
  lime_green: {
    id: 'lime_green',
    name: 'Lime Green',
    colors: ['#f1f8e9', '#dcedc8', '#aed581', '#8bc34a', '#689f38'],
    baseColor: '#8bc34a',
  },
};

/**
 * Get a palette by ID
 */
export const GetPaletteById = (id: string): ColorPalette | undefined => {
  return COLOR_PALETTES[id];
};

/**
 * Get all available palettes as an array
 */
export const GetAllPalettes = (): ColorPalette[] => {
  return Object.values(COLOR_PALETTES);
};

/**
 * Get palette IDs as an array
 */
export const GetPaletteIds = (): string[] => {
  return Object.keys(COLOR_PALETTES);
};

