import { MetricType } from '@types';

/**
 * Small pure helpers for normalizing HealthKit duration-like values.
 *
 * Goal: store durations consistently in minutes.
 */

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 1000 * 60;

export const DurationMinutesFromIsoRange = (
  startIso: string,
  endIso: string
): number => {
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  const durationMs = endMs - startMs;
  const minutes = durationMs / MS_PER_MINUTE;
  if (Number.isNaN(minutes) || !Number.isFinite(minutes)) return 0;
  return Math.max(minutes, 0);
};

/**
 * Some HealthKit APIs return duration-like quantities in either seconds or minutes
 * (depending on the underlying native mapping/version).
 *
 * We normalize to minutes using a conservative heuristic:
 * - If the value is larger than the maximum plausible minutes for the metric, treat it as seconds.
 * - Otherwise, assume it's already minutes.
 */
export const NormalizeDurationToMinutes = (
  duration: number,
  maxPlausibleMinutes: number = 24 * 60
): number => {
  if (Number.isNaN(duration) || !Number.isFinite(duration)) return 0;
  if (duration <= 0) return 0;

  const treatAsSeconds = duration > maxPlausibleMinutes;
  const minutes = treatAsSeconds ? duration / MINUTES_PER_HOUR : duration;
  return Math.max(minutes, 0);
};

/**
 * Unit to request from HealthKit for a metric, or undefined to use the
 * native default.
 *
 * react-native-health's getAppleExerciseTime and getAppleStandTime default
 * to SECONDS when no unit is passed. The seconds-vs-minutes heuristic in
 * NormalizeDurationToMinutes can't catch small values (a 20-minute day is
 * 1200 seconds, which looks like a plausible minute count), so duration
 * metrics must request minutes explicitly. The heuristic stays as a safety
 * net only.
 */
export const GetFetchUnitForMetric = (
  metricType: MetricType
): 'minute' | undefined => {
  switch (metricType) {
    case MetricType.EXERCISE_TIME:
    case MetricType.STANDING_TIME:
      return 'minute';
    default:
      return undefined;
  }
};
