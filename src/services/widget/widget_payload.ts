import { HealthDataStore } from '@types';
import { GetDateRange } from '@utils';

/**
 * How many days of history the widget payload keeps per metric.
 * The widget's activity wall never renders more than ~a year, so anything
 * older is dead weight the widget process would have to decode.
 */
export const WIDGET_PAYLOAD_MAX_DAYS = 400;

/**
 * Files the widget reads from the App Group container.
 * The widget must never open the shared UserDefaults suite — iOS hands the
 * process the entire suite (including the full multi-year health store),
 * which can blow the widget's ~30MB memory cap. Files are read individually.
 * Keep these names in sync with ios/FitnessTrackerWidget/WidgetDataManager.swift.
 */
export const WIDGET_DATA_FILE = 'widget_data.json';
export const WIDGET_PREFERENCES_FILE = 'widget_preferences.json';

/**
 * Build the trimmed store the iOS widget reads from the App Group.
 *
 * The widget extension runs under a hard ~30MB memory cap (not enforced on
 * the simulator). Decoding the full health store — the complete history for
 * every metric plus all exercise records — can blow past that cap and get
 * the extension killed mid-timeline, leaving the widget stuck on its
 * redacted placeholder. The widget only ever renders recent daily values,
 * so it gets its own small payload instead of the full store.
 */
export const BuildWidgetPayload = (
  healthData: HealthDataStore,
  maxDays: number = WIDGET_PAYLOAD_MAX_DAYS
): HealthDataStore => {
  const { start } = GetDateRange(maxDays);

  const trimmedMetrics = Object.entries(healthData.metrics).reduce(
    (acc, [metricType, metric]) => {
      acc[metricType] = {
        ...metric,
        dataPoints: metric.dataPoints.filter(dp => dp.date >= start),
      };
      return acc;
    },
    {} as Record<
      string,
      HealthDataStore['metrics'][keyof HealthDataStore['metrics']]
    >
  );

  return {
    ...healthData,
    metrics: trimmedMetrics as HealthDataStore['metrics'],
    exercises: [],
  };
};
