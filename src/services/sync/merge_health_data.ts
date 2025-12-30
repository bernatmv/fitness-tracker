import { HealthDataPoint, ExerciseDetail } from '@types';
import { GetStartOfDay } from '@utils';

const DateKey = (date: Date): string => {
  return GetStartOfDay(date).toISOString().split('T')[0];
};

/**
 * Merge metric datapoints by day.
 *
 * - Preserves existing points for dates not present in incoming.
 * - Overwrites existing points for dates present in incoming.
 * - Returns points sorted by date asc.
 */
export const MergeDataPointsByDay = (
  existing: HealthDataPoint[],
  incoming: HealthDataPoint[]
): HealthDataPoint[] => {
  const map = new Map<string, HealthDataPoint>();

  existing.forEach(dp => {
    map.set(DateKey(dp.date), dp);
  });

  incoming.forEach(dp => {
    map.set(DateKey(dp.date), dp);
  });

  return Array.from(map.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
};

/**
 * Merge exercises by ID.
 *
 * - Preserves existing exercises not present in incoming.
 * - Overwrites existing exercises when incoming has same id.
 */
export const MergeExercisesById = (
  existing: ExerciseDetail[],
  incoming: ExerciseDetail[]
): ExerciseDetail[] => {
  const map = new Map<string, ExerciseDetail>();
  existing.forEach(ex => map.set(ex.id, ex));
  incoming.forEach(ex => map.set(ex.id, ex));
  return Array.from(map.values());
};
