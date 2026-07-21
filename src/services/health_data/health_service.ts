import { Platform } from 'react-native';
import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';
import { HealthDataPoint, MetricType, ExerciseDetail } from '@types';
import {
  GetFetchChunkDays,
  GetFetchPeriodForMetric,
  GetFetchUnitForMetric,
  NormalizeDurationToMinutes,
  SplitDateRangeIntoChunks,
} from './health_normalization';
import { AggregateHealthResults, RawHealthResult } from './health_aggregation';

export type MetricFetchResult = {
  dataPoints: HealthDataPoint[];
  lastDataDate: Date | null;
};

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
  unit?: string;
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
  const result = await FetchMetricDataWithMeta(metricType, startDate, endDate);
  return result.dataPoints;
};

/**
 * Fetch metric data and include metadata about the last day with samples.
 * This is used for incremental refresh without being misled by padded 0-value points.
 */
export const FetchMetricDataWithMeta = async (
  metricType: MetricType,
  startDate: Date,
  endDate: Date
): Promise<MetricFetchResult> => {
  if (Platform.OS === 'ios') {
    return FetchIOSMetricData(metricType, startDate, endDate);
  } else {
    return {
      dataPoints: await FetchAndroidMetricData(metricType, startDate, endDate),
      lastDataDate: null,
    };
  }
};

/**
 * Fetch a single date-range chunk of raw HealthKit results
 */
const FetchIOSHealthChunk = (
  fetchFunction: IOSFetchFunction,
  metricType: MetricType,
  options: HealthFetchOptions
): Promise<RawHealthResult[]> => {
  return new Promise((resolve, reject) => {
    fetchFunction(options, (error: string, results: unknown) => {
      if (error) {
        console.error(`Error fetching ${metricType}:`, error);
        reject(new Error(error));
        return;
      }

      if (Array.isArray(results)) {
        resolve(results as RawHealthResult[]);
      } else if (results) {
        resolve([results as RawHealthResult]);
      } else {
        resolve([]);
      }
    });
  });
};

/**
 * Fetch iOS health data
 */
const FetchIOSMetricData = async (
  metricType: MetricType,
  startDate: Date,
  endDate: Date
): Promise<MetricFetchResult> => {
  const fetchFunction = GetIOSFetchFunction(
    metricType
  ) as IOSFetchFunction | null;

  if (!fetchFunction) {
    throw new Error(`Unsupported metric type: ${metricType}`);
  }

  const fetchUnit = GetFetchUnitForMetric(metricType);
  // Daily aggregation for most metrics; hourly buckets for standing
  // time so we can count Apple-ring-style "stand hours".
  const period = GetFetchPeriodForMetric(metricType);

  // High-volume metrics (hourly standing buckets, raw sleep samples) are
  // split into ~1-year chunks fetched in parallel: several small bridge
  // payloads are much faster than one giant multi-year payload.
  const chunks = SplitDateRangeIntoChunks(
    startDate,
    endDate,
    GetFetchChunkDays(metricType)
  );

  const chunkResults = await Promise.all(
    chunks.map(chunk =>
      FetchIOSHealthChunk(fetchFunction, metricType, {
        startDate: chunk.start.toISOString(),
        endDate: chunk.end.toISOString(),
        period,
        // Duration metrics must request minutes explicitly: the native
        // default is seconds, and small daily values slip past the
        // seconds-vs-minutes heuristic (e.g. 20 min = 1200 s <= 1440).
        ...(fetchUnit ? { unit: fetchUnit } : {}),
      })
    )
  );

  return AggregateHealthResults(
    metricType,
    chunkResults.flat(),
    startDate,
    endDate
  );
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
        duration: NormalizeDurationToMinutes(workout.duration, 24 * 60),
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
