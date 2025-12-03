/**
 * Convert hex color to RGB
 */
export const HexToRgb = (
  hex: string
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Convert RGB to hex color
 */
export const RgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

/**
 * Lighten a color by percentage
 */
export const LightenColor = (hex: string, percent: number): string => {
  const rgb = HexToRgb(hex);
  if (!rgb) return hex;

  const amount = Math.round(2.55 * percent);
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);

  return RgbToHex(r, g, b);
};

/**
 * Darken a color by percentage
 */
export const DarkenColor = (hex: string, percent: number): string => {
  const rgb = HexToRgb(hex);
  if (!rgb) return hex;

  const amount = Math.round(2.55 * percent);
  const r = Math.max(0, rgb.r - amount);
  const g = Math.max(0, rgb.g - amount);
  const b = Math.max(0, rgb.b - amount);

  return RgbToHex(r, g, b);
};

/**
 * Get color for value based on thresholds
 */
export const GetColorForValue = (
  value: number,
  thresholds: number[],
  colors: string[]
): string => {
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (value >= thresholds[i] && value < thresholds[i + 1]) {
      return colors[i];
    }
  }
  // Return last color for values >= last threshold
  return colors[colors.length - 1];
};

/**
 * Validate hex color
 */
export const IsValidHexColor = (hex: string): boolean => {
  return /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(hex);
};

/**
 * Normalize hex color to include # prefix
 */
export const NormalizeHexColor = (hex: string): string => {
  if (hex.startsWith('#')) {
    return hex.toLowerCase();
  }
  return `#${hex.toLowerCase()}`;
};

/**
 * Reorder colors based on theme mode
 * Colors are stored in canonical order (darkest first from index 1)
 * - Dark mode: darkest first (keep canonical order)
 * - Light mode: lightest first (reverse from index 1)
 */
export const ReorderColorsForTheme = (
  colors: string[],
  isDarkMode: boolean
): string[] => {
  if (colors.length <= 1) return colors;

  // Keep index 0 (light gray for no data) unchanged
  const firstColor = colors[0];
  const restColors = colors.slice(1);

  if (isDarkMode) {
    // Dark mode: darkest first (canonical order)
    return [firstColor, ...restColors];
  } else {
    // Light mode: lightest first (reverse from index 1)
    return [firstColor, ...restColors.reverse()];
  }
};
