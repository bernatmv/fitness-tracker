import {
  DurationMinutesFromIsoRange,
  NormalizeDurationToMinutes,
} from '../health_normalization';

describe('health_normalization', () => {
  describe('DurationMinutesFromIsoRange', () => {
    it('returns 0 for invalid dates', () => {
      expect(DurationMinutesFromIsoRange('nope', 'also-nope')).toBe(0);
    });

    it('returns 0 for negative durations', () => {
      expect(
        DurationMinutesFromIsoRange('2025-01-01T01:00:00Z', '2025-01-01T00:00:00Z')
      ).toBe(0);
    });

    it('computes minutes for a normal range', () => {
      expect(
        DurationMinutesFromIsoRange('2025-01-01T00:00:00Z', '2025-01-01T01:30:00Z')
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
});


