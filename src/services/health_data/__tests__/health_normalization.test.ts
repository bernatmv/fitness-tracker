import { MetricType } from '@types';
import {
  DurationMinutesFromIsoRange,
  NormalizeDurationToMinutes,
  GetFetchUnitForMetric,
  GetFetchPeriodForMetric,
  GetFetchChunkDays,
  SplitDateRangeIntoChunks,
} from '../health_normalization';

describe('health_normalization', () => {
  describe('DurationMinutesFromIsoRange', () => {
    it('returns 0 for invalid dates', () => {
      expect(DurationMinutesFromIsoRange('nope', 'also-nope')).toBe(0);
    });

    it('returns 0 for negative durations', () => {
      expect(
        DurationMinutesFromIsoRange(
          '2025-01-01T01:00:00Z',
          '2025-01-01T00:00:00Z'
        )
      ).toBe(0);
    });

    it('computes minutes for a normal range', () => {
      expect(
        DurationMinutesFromIsoRange(
          '2025-01-01T00:00:00Z',
          '2025-01-01T01:30:00Z'
        )
      ).toBe(90);
    });
  });

  describe('NormalizeWorkoutDurationToMinutes', () => {
    it('returns 0 for NaN/Infinity/negative', () => {
      expect(NormalizeDurationToMinutes(NaN)).toBe(0);
      expect(NormalizeDurationToMinutes(Infinity)).toBe(0);
      expect(NormalizeDurationToMinutes(-1)).toBe(0);
    });

    it('treats small values as already-minutes', () => {
      expect(NormalizeDurationToMinutes(45)).toBe(45);
    });

    it('treats large values as seconds and converts to minutes', () => {
      // 30 minutes expressed in seconds
      expect(NormalizeDurationToMinutes(1800)).toBe(30);
    });

    it('does not misclassify large-but-plausible minute values when max is higher', () => {
      // 12 hours in minutes
      expect(NormalizeDurationToMinutes(720, 24 * 60)).toBe(720);
    });
  });

  describe('SplitDateRangeIntoChunks', () => {
    const d = (iso: string) => new Date(iso);

    it('returns a single chunk when the range fits maxDays', () => {
      const chunks = SplitDateRangeIntoChunks(
        d('2026-01-01T00:00:00Z'),
        d('2026-06-01T00:00:00Z'),
        366
      );
      expect(chunks).toHaveLength(1);
      expect(chunks[0].start.toISOString()).toBe('2026-01-01T00:00:00.000Z');
      expect(chunks[0].end.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    });

    it('splits a 10-year range into ~yearly contiguous chunks', () => {
      const start = d('2016-07-21T00:00:00Z');
      const end = d('2026-07-21T00:00:00Z');
      const chunks = SplitDateRangeIntoChunks(start, end, 366);

      expect(chunks.length).toBeGreaterThanOrEqual(10);
      expect(chunks[0].start.getTime()).toBe(start.getTime());
      expect(chunks[chunks.length - 1].end.getTime()).toBe(end.getTime());
      // contiguous and non-overlapping: next start is 1ms after previous end
      for (let i = 1; i < chunks.length; i++) {
        expect(chunks[i].start.getTime()).toBe(chunks[i - 1].end.getTime() + 1);
      }
      // every chunk within maxDays
      for (const c of chunks) {
        const days = (c.end.getTime() - c.start.getTime()) / 86400000;
        expect(days).toBeLessThanOrEqual(366);
      }
    });
  });

  describe('GetFetchChunkDays', () => {
    it('chunks high-volume sample metrics by year', () => {
      expect(GetFetchChunkDays(MetricType.STANDING_TIME)).toBe(366);
      expect(GetFetchChunkDays(MetricType.SLEEP_HOURS)).toBe(366);
    });

    it('fetches daily-bucketed metrics in a single query', () => {
      expect(GetFetchChunkDays(MetricType.STEPS)).toBe(Infinity);
      expect(GetFetchChunkDays(MetricType.CALORIES_BURNED)).toBe(Infinity);
    });
  });

  describe('GetFetchPeriodForMetric', () => {
    it('fetches standing time in hourly buckets (stand-hours semantics)', () => {
      expect(GetFetchPeriodForMetric(MetricType.STANDING_TIME)).toBe(60);
    });

    it('fetches everything else as daily aggregates', () => {
      expect(GetFetchPeriodForMetric(MetricType.STEPS)).toBe(1440);
      expect(GetFetchPeriodForMetric(MetricType.EXERCISE_TIME)).toBe(1440);
      expect(GetFetchPeriodForMetric(MetricType.SLEEP_HOURS)).toBe(1440);
    });
  });

  describe('GetFetchUnitForMetric', () => {
    it('requests minutes for duration metrics (native default is seconds)', () => {
      expect(GetFetchUnitForMetric(MetricType.EXERCISE_TIME)).toBe('minute');
      expect(GetFetchUnitForMetric(MetricType.STANDING_TIME)).toBe('minute');
    });

    it('leaves non-duration metrics on their native default units', () => {
      expect(GetFetchUnitForMetric(MetricType.STEPS)).toBeUndefined();
      expect(GetFetchUnitForMetric(MetricType.CALORIES_BURNED)).toBeUndefined();
      expect(GetFetchUnitForMetric(MetricType.FLOORS_CLIMBED)).toBeUndefined();
      expect(GetFetchUnitForMetric(MetricType.SLEEP_HOURS)).toBeUndefined();
    });
  });
});
