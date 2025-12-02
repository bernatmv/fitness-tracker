/**
 * Color palette definitions for activity visualization
 * Each palette contains 5 colors that represent increasing intensity levels
 */

export interface ColorPalette {
  /** Unique identifier for the palette */
  id: string;
  /** Display name for the palette */
  name: string;
  /** Color arrays for light and dark modes */
  colors: {
    /** Array of 5 colors for light mode (hex format) */
    light: [string, string, string, string, string];
    /** Array of 5 colors for dark mode (hex format) - index 0 stays same, indices 1-4 are reversed */
    dark: [string, string, string, string, string];
  };
}

/**
 * Collection of available color palettes
 */
export const COLOR_PALETTES: Record<string, ColorPalette> = {
  // Current palettes from default config
  github_green: {
    id: 'github_green',
    name: 'GitHub Green',
    colors: {
      light: ['#eff2f5', '#aceebb', '#4ac26b', '#2da44e', '#116329'],
      dark: ['#151b23', '#033a16', '#196c2e', '#2ea043', '#56d364'],
    },
  },
  ios_health_red: {
    id: 'ios_health_red',
    name: 'iOS Health Red',
    colors: {
      light: ['#eff2f5', '#f9b8b2', '#f9827c', '#e74c3c', '#c0392b'],
      dark: ['#151b23', '#c0392b', '#e74c3c', '#f9827c', '#f9b8b2'],
    },
  },
  ios_health_green: {
    id: 'ios_health_green',
    name: 'iOS Health Green',
    colors: {
      light: ['#eff2f5', '#bdf6d8', '#7cefa1', '#34c759', '#1eae4a'],
      dark: ['#151b23', '#1eae4a', '#34c759', '#7cefa1', '#bdf6d8'],
    },
  },
  ios_health_blue: {
    id: 'ios_health_blue',
    name: 'iOS Health Blue',
    colors: {
      light: ['#eff2f5', '#b3dbf7', '#6ec1f6', '#007aff', '#004a99'],
      dark: ['#151b23', '#004a99', '#007aff', '#6ec1f6', '#b3dbf7'],
    },
  },
  ios_health_purple: {
    id: 'ios_health_purple',
    name: 'iOS Health Purple',
    colors: {
      light: ['#eff2f5', '#d1b3ff', '#a580e8', '#8e44ad', '#5e3370'],
      dark: ['#151b23', '#5e3370', '#8e44ad', '#a580e8', '#d1b3ff'],
    },
  },

  // Additional stylish palettes
  ocean_blue: {
    id: 'ocean_blue',
    name: 'Ocean Blue',
    colors: {
      light: ['#eff2f5', '#b3e5fc', '#4fc3f7', '#0288d1', '#01579b'],
      dark: ['#151b23', '#01579b', '#0288d1', '#4fc3f7', '#b3e5fc'],
    },
  },
  sunset_orange: {
    id: 'sunset_orange',
    name: 'Sunset Orange',
    colors: {
      light: ['#eff2f5', '#ffe0b2', '#ffb74d', '#ff9800', '#e65100'],
      dark: ['#151b23', '#e65100', '#ff9800', '#ffb74d', '#ffe0b2'],
    },
  },
  lavender_purple: {
    id: 'lavender_purple',
    name: 'Lavender Purple',
    colors: {
      light: ['#eff2f5', '#e1bee7', '#ba68c8', '#9c27b0', '#6a1b9a'],
      dark: ['#151b23', '#6a1b9a', '#9c27b0', '#ba68c8', '#e1bee7'],
    },
  },
  monochrome_gray: {
    id: 'monochrome_gray',
    name: 'Monochrome Gray',
    colors: {
      light: ['#eff2f5', '#e0e0e0', '#9e9e9e', '#616161', '#212121'],
      dark: ['#151b23', '#212121', '#616161', '#9e9e9e', '#e0e0e0'],
    },
  },
  fire_red: {
    id: 'fire_red',
    name: 'Fire Red',
    colors: {
      light: ['#eff2f5', '#ffcdd2', '#ef5350', '#d32f2f', '#b71c1c'],
      dark: ['#151b23', '#b71c1c', '#d32f2f', '#ef5350', '#ffcdd2'],
    },
  },
  tropical_teal: {
    id: 'tropical_teal',
    name: 'Tropical Teal',
    colors: {
      light: ['#eff2f5', '#b2ebf2', '#26c6da', '#00acc1', '#00838f'],
      dark: ['#151b23', '#00838f', '#00acc1', '#26c6da', '#b2ebf2'],
    },
  },
  amber_gold: {
    id: 'amber_gold',
    name: 'Amber Gold',
    colors: {
      light: ['#eff2f5', '#ffecb3', '#ffc107', '#ffa000', '#ff6f00'],
      dark: ['#151b23', '#ff6f00', '#ffa000', '#ffc107', '#ffecb3'],
    },
  },
  deep_purple: {
    id: 'deep_purple',
    name: 'Deep Purple',
    colors: {
      light: ['#eff2f5', '#d1c4e9', '#9575cd', '#673ab7', '#4527a0'],
      dark: ['#151b23', '#4527a0', '#673ab7', '#9575cd', '#d1c4e9'],
    },
  },
  rose_pink: {
    id: 'rose_pink',
    name: 'Rose Pink',
    colors: {
      light: ['#eff2f5', '#f8bbd0', '#f48fb1', '#e91e63', '#c2185b'],
      dark: ['#151b23', '#c2185b', '#e91e63', '#f48fb1', '#f8bbd0'],
    },
  },
  cyan_blue: {
    id: 'cyan_blue',
    name: 'Cyan Blue',
    colors: {
      light: ['#eff2f5', '#b2ebf2', '#4dd0e1', '#00bcd4', '#0097a7'],
      dark: ['#151b23', '#0097a7', '#00bcd4', '#4dd0e1', '#b2ebf2'],
    },
  },
  indigo_night: {
    id: 'indigo_night',
    name: 'Indigo Night',
    colors: {
      light: ['#eff2f5', '#c5cae9', '#7986cb', '#3f51b5', '#283593'],
      dark: ['#151b23', '#283593', '#3f51b5', '#7986cb', '#c5cae9'],
    },
  },
  lime_green: {
    id: 'lime_green',
    name: 'Lime Green',
    colors: {
      light: ['#eff2f5', '#dcedc8', '#aed581', '#8bc34a', '#689f38'],
      dark: ['#151b23', '#689f38', '#8bc34a', '#aed581', '#dcedc8'],
    },
  },
};

export const GetPaletteById = (id: string): ColorPalette | undefined => {
  return COLOR_PALETTES[id];
};

export const GetAllPalettes = (): ColorPalette[] => {
  return Object.values(COLOR_PALETTES);
};

export const GetPaletteIds = (): string[] => {
  return Object.keys(COLOR_PALETTES);
};

export const GetPaletteColorsById = (id: string, mode: 'light' | 'dark'): string[] => {
  const palette = COLOR_PALETTES[id];

  if (!palette) {
    return [];
  }
  
  return palette.colors[mode] || [];
};