import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  differenceInDays,
} from 'date-fns';
import { getLocales } from 'react-native-localize';

/**
 * Get locale from device settings
 */
export const GetLocale = (): Locale => {
  const locales = getLocales();
  if (locales.length > 0) {
    const locale = locales[0];
    return {
      code: locale.languageCode,
      ...locale,
    };
  }
  return { code: 'en' };
};

/**
 * Format date based on user locale
 */
export const FormatDate = (date: Date, formatString: string = 'PP'): string => {
  return format(date, formatString);
};

/**
 * Format time based on user locale
 */
export const FormatTime = (date: Date): string => {
  return format(date, 'p');
};

/**
 * Format date and time
 */
export const FormatDateTime = (date: Date): string => {
  return format(date, 'PPp');
};

/**
 * Parse ISO date string
 */
export const ParseDate = (dateString: string): Date => {
  return parseISO(dateString);
};

/**
 * Get start of day
 */
export const GetStartOfDay = (date: Date = new Date()): Date => {
  return startOfDay(date);
};

/**
 * Get end of day
 */
export const GetEndOfDay = (date: Date = new Date()): Date => {
  return endOfDay(date);
};

/**
 * Get date range for last N days
 */
export const GetDateRange = (days: number): { start: Date; end: Date } => {
  const end = new Date();
  const start = subDays(end, days - 1);
  return {
    start: GetStartOfDay(start),
    end: GetEndOfDay(end),
  };
};

/**
 * Get array of dates between start and end
 */
export const GetDateArray = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const daysDiff = differenceInDays(endDate, startDate);

  for (let i = 0; i <= daysDiff; i++) {
    dates.push(subDays(endDate, daysDiff - i));
  }

  return dates;
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const FormatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  return FormatDate(date);
};

type Locale = {
  code: string;
  [key: string]: unknown;
};
