import { MergeDataPointsByDay, MergeExercisesById } from '../merge_health_data';
import { ExerciseDetail, HealthDataPoint, MetricType, MetricUnit } from '@types';

describe('merge_health_data', () => {
  describe('MergeDataPointsByDay', () => {
    const dp = (isoDate: string, value: number): HealthDataPoint => ({
      date: new Date(isoDate),
      value,
      metricType: MetricType.STEPS,
      unit: MetricUnit.COUNT,
    });

    it('preserves existing points not present in incoming', () => {
      const existing = [dp('2024-01-01T12:00:00Z', 1), dp('2024-01-02T12:00:00Z', 2)];
      const incoming = [dp('2024-01-02T12:00:00Z', 22)];

      const merged = MergeDataPointsByDay(existing, incoming);

      expect(merged.map(x => [x.date.toISOString().split('T')[0], x.value])).toEqual([
        ['2024-01-01', 1],
        ['2024-01-02', 22],
      ]);
    });

    it('adds new dates from incoming', () => {
      const existing = [dp('2024-01-01T12:00:00Z', 1)];
      const incoming = [dp('2024-01-03T12:00:00Z', 3)];

      const merged = MergeDataPointsByDay(existing, incoming);

      expect(merged.map(x => x.date.toISOString().split('T')[0])).toEqual([
        '2024-01-01',
        '2024-01-03',
      ]);
    });
  });

  describe('MergeExercisesById', () => {
    const ex = (id: string, isoDate: string): ExerciseDetail =>
      ({
        id,
        date: new Date(isoDate),
        type: 'Run',
        duration: 10,
        caloriesBurned: 100,
        distance: 1,
      }) as unknown as ExerciseDetail;

    it('overwrites by id and preserves others', () => {
      const existing = [ex('a', '2024-01-01T00:00:00Z'), ex('b', '2024-01-02T00:00:00Z')];
      const incoming = [ex('b', '2024-01-03T00:00:00Z'), ex('c', '2024-01-04T00:00:00Z')];

      const merged = MergeExercisesById(existing, incoming);

      const byId = new Map(merged.map(x => [x.id, x]));
      expect(byId.get('a')?.date.toISOString().split('T')[0]).toBe('2024-01-01');
      expect(byId.get('b')?.date.toISOString().split('T')[0]).toBe('2024-01-03');
      expect(byId.get('c')?.date.toISOString().split('T')[0]).toBe('2024-01-04');
    });
  });
});


