/**
 * Health metric types supported by the app
 */
export enum MetricType {
  CALORIES_BURNED = 'CALORIES_BURNED',
  EXERCISE_TIME = 'EXERCISE_TIME',
  STANDING_TIME = 'STANDING_TIME',
  STEPS = 'STEPS',
  FLOORS_CLIMBED = 'FLOORS_CLIMBED',
  SLEEP_HOURS = 'SLEEP_HOURS',
}

/**
 * Unit types for different metrics
 */
export enum MetricUnit {
  CALORIES = 'calories',
  MINUTES = 'minutes',
  HOURS = 'hours',
  STEPS = 'steps',
  FLOORS = 'floors',
}

/**
 * Single data point for a health metric
 */
export interface HealthDataPoint {
  date: Date;
  value: number;
  metricType: MetricType;
  unit: MetricUnit;
}

/**
 * Exercise detail record
 */
export interface ExerciseDetail {
  id: string;
  date: Date;
  type: string; // e.g., 'Running', 'Cycling', 'Swimming'
  duration: number; // in minutes
  caloriesBurned: number;
  distance?: number; // in meters
  heartRateAverage?: number;
  heartRateMax?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Health data collection for a specific metric
 */
export interface HealthMetricData {
  metricType: MetricType;
  unit: MetricUnit;
  dataPoints: HealthDataPoint[];
  lastSync: Date;
}

/**
 * Complete health data store
 */
export interface HealthDataStore {
  metrics: Record<MetricType, HealthMetricData>;
  exercises: ExerciseDetail[];
  lastFullSync: Date;
}
