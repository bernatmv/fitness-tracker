import { HealthDataPoint, MetricType } from '@types';
import { METRIC_UNITS } from '@constants';
import { GetStartOfDay, GetDateArray } from '@utils';
import {
  DurationMinutesFromIsoRange,
  NormalizeDurationToMinutes,
} from './health_normalization';

/**
 * Pure aggregation of raw HealthKit results into padded daily data points.
 * Kept free of native imports so it can be unit-tested directly.
 */

export type RawHealthResult = {
  value?: number;
  quantity?: number;
  startDate?: string;
  date?: string;
  endDate?: string;
};

export type MetricAggregationResult = {
  dataPoints: HealthDataPoint[];
  lastDataDate: Date | null;
};

export const AggregateHealthResults = (
  metricType: MetricType,
  results: RawHealthResult[],
  startDate: Date,
  endDate: Date
): MetricAggregationResult => {
  const dailyTotals = new Map<string, number>();
  const daysWithSamples = new Set<string>();

  results.forEach(normalized => {
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
      value = DurationMinutesFromIsoRange(startIso, endIso);
      dailyTotals.set(startDay, (dailyTotals.get(startDay) || 0) + value);
      daysWithSamples.add(startDay);
    } else if (metricType === MetricType.STANDING_TIME) {
      // Each result is an HOURLY bucket (period 60). Count Apple-ring
      // style "stand hours": a clock hour counts when it contains any
      // standing at all.
      value = NormalizeDurationToMinutes(value, 60);
      if (value > 0) {
        dailyTotals.set(
          startDay,
          Math.min((dailyTotals.get(startDay) || 0) + 1, 24)
        );
      }
      daysWithSamples.add(startDay);
    } else if (metricType === MetricType.EXERCISE_TIME) {
      // HealthKit may return exercise time in seconds; normalize to minutes.
      value = NormalizeDurationToMinutes(value, 24 * 60);
      dailyTotals.set(startDay, (dailyTotals.get(startDay) || 0) + value);
      daysWithSamples.add(startDay);
    } else {
      // For other metrics (steps, calories, floors), sum directly.
      // HealthKit daily statistics buckets return one row per day.
      dailyTotals.set(startDay, (dailyTotals.get(startDay) || 0) + value);
      daysWithSamples.add(startDay);
    }
  });

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

  const lastDataDate =
    daysWithSamples.size > 0
      ? new Date(
          `${Array.from(daysWithSamples).sort().slice(-1)[0]}T00:00:00.000Z`
        )
      : null;

  return { dataPoints, lastDataDate };
};
