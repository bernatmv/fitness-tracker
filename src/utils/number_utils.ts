/**
 * Format a number with thousands separators
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string with thousands separators
 */
export const FormatNumber = (value: number, decimals: number = 0): string => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format a number in compact notation (K for thousands, M for millions)
 * @param value - The number to format
 * @param decimals - Number of decimal places for compact notation (default: 1)
 * @returns Formatted string with K/M notation
 */
export const FormatCompactNumber = (
  value: number,
  decimals: number = 1
): string => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${millions.toFixed(decimals)}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${thousands.toFixed(decimals)}K`;
  }
  return value.toFixed(0);
};
