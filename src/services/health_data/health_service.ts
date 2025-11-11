import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import {
  HealthDataPoint,
  MetricType,
  MetricUnit,
  ExerciseDetail,
} from '@types';
import { METRIC_UNITS } from '@constants';

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

/**
 * Request health data permissions
 */
export const RequestHealthPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS, (error) => {
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
    return new Promise((resolve) => {
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
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period: 1440, // Daily aggregation (minutes in a day)
    };

    const fetchFunction = GetIOSFetchFunction(metricType);
    
    if (!fetchFunction) {
      reject(new Error(`Unsupported metric type: ${metricType}`));
      return;
    }

    fetchFunction(options, (error: string, results: HealthValue[]) => {
      if (error) {
        console.error(`Error fetching ${metricType}:`, error);
        reject(new Error(error));
        return;
      }

      const dataPoints: HealthDataPoint[] = results.map((result) => ({
        date: new Date(result.startDate || result.date),
        value: result.value,
        metricType,
        unit: METRIC_UNITS[metricType],
      }));

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
      return AppleHealthKit.getStepCount;
    case MetricType.FLOORS_CLIMBED:
      return AppleHealthKit.getFlightsClimbed;
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
  metricType: MetricType,
  startDate: Date,
  endDate: Date
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

    AppleHealthKit.getSamples(options, (error: string, results: unknown[]) => {
      if (error) {
        console.error('Error fetching exercises:', error);
        reject(new Error(error));
        return;
      }

      const exercises: ExerciseDetail[] = (results as ExerciseWorkout[]).map((workout) => ({
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
  startDate: Date,
  endDate: Date
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

