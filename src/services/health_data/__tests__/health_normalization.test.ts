import {
  DurationMinutesFromIsoRange,
  NormalizeWorkoutDurationToMinutes,
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
      expect(NormalizeWorkoutDurationToMinutes(NaN)).toBe(0);
      expect(NormalizeWorkoutDurationToMinutes(Infinity)).toBe(0);
      expect(NormalizeWorkoutDurationToMinutes(-1)).toBe(0);
    });

    it('treats small values as already-minutes', () => {
      expect(NormalizeWorkoutDurationToMinutes(45)).toBe(45);
    });

    it('treats large values as seconds and converts to minutes', () => {
      // 30 minutes expressed in seconds
      expect(NormalizeWorkoutDurationToMinutes(1800)).toBe(30);
    });
  });
});


