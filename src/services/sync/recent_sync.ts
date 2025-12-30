import { differenceInDays } from 'date-fns';
import { GetStartOfDay } from '@utils';

export const CalculateDaysToSyncFromLastDataDate = (
  lastDataDate: Date | null | undefined,
  maxDays: number,
  now: Date = new Date()
): number => {
  if (!lastDataDate) {
    return maxDays;
  }

  const start = GetStartOfDay(lastDataDate);
  const end = GetStartOfDay(now);
  const days = differenceInDays(end, start) + 1; // inclusive of lastDataDate day

  // Clamp into [1, maxDays]
  return Math.max(1, Math.min(maxDays, days));
};
