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
 * HealthKit workout samples may return duration in either seconds or minutes,
 * depending on the underlying native mapping/version.
 *
 * We normalize to minutes using a conservative heuristic:
 * - If value is "large enough" to be seconds for a typical workout, treat as seconds.
 * - Otherwise, assume it's already minutes.
 */
export const NormalizeWorkoutDurationToMinutes = (duration: number): number => {
  if (Number.isNaN(duration) || !Number.isFinite(duration)) return 0;
  if (duration <= 0) return 0;

  // If duration is > 10 hours in minutes, it's almost certainly seconds (e.g., 3600 for 60 min).
  // 10 hours = 600 minutes.
  const treatAsSeconds = duration > 600;
  const minutes = treatAsSeconds ? duration / MINUTES_PER_HOUR : duration;
  return Math.max(minutes, 0);
};


