import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { HealthDataPoint, MetricType, ExerciseDetail } from '@types';
import { METRIC_UNITS } from '@constants';
import { GetDateArray, GetStartOfDay } from '@utils';

/**
 * Health data permissions required
 */
const HEALTH_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
      AppleHealthKit.Constants.Permissions.AppleExerciseTime,
      AppleHealthKit.Constants.Permissions.AppleStandTime,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.Workout,
    ],
    write: [],
  },
};

type HealthFetchOptions = {
  startDate: string;
  endDate: string;
  period?: number;
};

type IOSFetchFunction = (
  options: HealthFetchOptions,
  callback: (error: string, results: unknown) => void
) => void;

/**
 * Request health data permissions
 */
export const RequestHealthPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return new Promise(resolve => {
      AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS, error => {
        if (error) {
          console.error('Error requesting health permissions:', error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } else {
    // Android Health Connect implementation
    // TODO: Implement Android Health Connect permissions
    console.warn('Android Health Connect not yet implemented');
    return false;
  }
};

/**
 * Check if health permissions are granted
 */
export const CheckHealthPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return new Promise(resolve => {
      AppleHealthKit.isAvailable((error, available) => {
        if (error || !available) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } else {
    // Android Health Connect check
    // TODO: Implement Android Health Connect permission check
    return false;
  }
};

/**
 * Fetch health data for a specific metric type
 */
export const FetchMetricData = async (
  metricType: MetricType,
  startDate: Date,
  endDate: Date
): Promise<HealthDataPoint[]> => {
  if (Platform.OS === 'ios') {
    return FetchIOSMetricData(metricType, startDate, endDate);
  } else {
    return FetchAndroidMetricData(metricType, startDate, endDate);
  }
};

/**
 * Fetch iOS health data
 */
const FetchIOSMetricData = async (
  metricType: MetricType,
  startDate: Date,
  endDate: Date
): Promise<HealthDataPoint[]> => {
  return new Promise((resolve, reject) => {
    const options: HealthFetchOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period: 1440, // Daily aggregation (minutes in a day)
    };

    const fetchFunction = GetIOSFetchFunction(
      metricType
    ) as IOSFetchFunction | null;

    if (!fetchFunction) {
      reject(new Error(`Unsupported metric type: ${metricType}`));
      return;
    }

    fetchFunction(options, (error: string, results: unknown) => {
      if (error) {
        console.error(`Error fetching ${metricType}:`, error);
        reject(new Error(error));
        return;
      }

      let safeResults: HealthValue[] = [];
      if (Array.isArray(results)) {
        safeResults = results as HealthValue[];
      } else if (results) {
        safeResults = [results as HealthValue];
      }

      const dailyTotals = new Map<string, number>();
      // For standing time, we need to sum minutes first, then convert to hours
      const dailyTotalsMinutes = new Map<string, number>();

      safeResults.forEach(result => {
        const normalized = result as HealthValue & {
          startDate?: string;
          date?: string;
          endDate?: string;
          quantity?: number;
        };
        const startIso =
          normalized.startDate ??
          normalized.date ??
          normalized.endDate ??
          new Date().toISOString();
        const startDay = GetStartOfDay(new Date(startIso))
          .toISOString()
          .split('T')[0];

        let value = normalized.value ?? normalized.quantity ?? 0;

        if (metricType === MetricType.SLEEP_HOURS) {
          const endIso = normalized.endDate ?? startIso;
          const durationHours =
            (new Date(endIso).getTime() - new Date(startIso).getTime()) /
            (1000 * 60 * 60);
          value = isNaN(durationHours) ? 0 : Math.max(durationHours, 0);
          dailyTotals.set(startDay, (dailyTotals.get(startDay) || 0) + value);
        } else if (metricType === MetricType.STANDING_TIME) {
          // Sum minutes first (don't convert yet)
          dailyTotalsMinutes.set(
            startDay,
            (dailyTotalsMinutes.get(startDay) || 0) + value
          );
        } else {
          // For other metrics (exercise time, steps, etc.), sum directly
          // Note: If HealthKit returns multiple samples per day, they should be
          // incremental (each adds more time), so summing is correct.
          // If period parameter works correctly, we should get one sample per day.
          dailyTotals.set(startDay, (dailyTotals.get(startDay) || 0) + value);
        }
      });

      // Convert standing time from minutes to hours after summing
      if (metricType === MetricType.STANDING_TIME) {
        dailyTotalsMinutes.forEach((totalMinutes, day) => {
          const hours = totalMinutes / 60;
          dailyTotals.set(day, Math.round(hours));
        });
      }

      const allDates = GetDateArray(
        GetStartOfDay(startDate),
        GetStartOfDay(endDate)
      );

      const dataPoints: HealthDataPoint[] = allDates.map(date => {
        const key = date.toISOString().split('T')[0];
        return {
          date,
          value: dailyTotals.get(key) || 0,
          metricType,
          unit: METRIC_UNITS[metricType],
        };
      });

      resolve(dataPoints);
    });
  });
};

/**
 * Get iOS fetch function for metric type
 */
const GetIOSFetchFunction = (metricType: MetricType) => {
  switch (metricType) {
    case MetricType.CALORIES_BURNED:
      return AppleHealthKit.getActiveEnergyBurned;
    case MetricType.STEPS:
      return AppleHealthKit.getDailyStepCountSamples;
    case MetricType.FLOORS_CLIMBED:
      return AppleHealthKit.getDailyFlightsClimbedSamples;
    case MetricType.EXERCISE_TIME:
      return AppleHealthKit.getAppleExerciseTime;
    case MetricType.STANDING_TIME:
      return AppleHealthKit.getAppleStandTime;
    case MetricType.SLEEP_HOURS:
      return AppleHealthKit.getSleepSamples;
    default:
      return null;
  }
};

/**
 * Fetch Android health data
 */
const FetchAndroidMetricData = async (
  _metricType: MetricType,
  _startDate: Date,
  _endDate: Date
): Promise<HealthDataPoint[]> => {
  // TODO: Implement Android Health Connect data fetching
  console.warn('Android Health Connect not yet implemented');
  return [];
};

/**
 * Fetch exercise details
 */
export const FetchExercises = async (
  startDate: Date,
  endDate: Date
): Promise<ExerciseDetail[]> => {
  if (Platform.OS === 'ios') {
    return FetchIOSExercises(startDate, endDate);
  } else {
    return FetchAndroidExercises(startDate, endDate);
  }
};

/**
 * Fetch iOS exercise data
 */
const FetchIOSExercises = async (
  startDate: Date,
  endDate: Date
): Promise<ExerciseDetail[]> => {
  return new Promise((resolve, reject) => {
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getSamples(options, (error: string, results?: unknown[]) => {
      if (error) {
        console.error('Error fetching exercises:', error);
        reject(new Error(error));
        return;
      }

      const workouts = (
        Array.isArray(results) ? results : []
      ) as ExerciseWorkout[];

      const exercises: ExerciseDetail[] = workouts.map(workout => ({
        id: workout.id || `${workout.activityName}-${workout.start}`,
        date: new Date(workout.start),
        type: workout.activityName,
        duration: workout.duration / 60, // Convert seconds to minutes
        caloriesBurned: workout.calories || 0,
        distance: workout.distance,
        metadata: workout.metadata,
      }));

      resolve(exercises);
    });
  });
};

/**
 * Fetch Android exercise data
 */
const FetchAndroidExercises = async (
  _startDate: Date,
  _endDate: Date
): Promise<ExerciseDetail[]> => {
  // TODO: Implement Android Health Connect exercise fetching
  console.warn('Android Health Connect not yet implemented');
  return [];
};

/**
 * Types for iOS workout data
 */
interface ExerciseWorkout {
  id?: string;
  activityName: string;
  start: string;
  duration: number;
  calories?: number;
  distance?: number;
  metadata?: Record<string, unknown>;
}
