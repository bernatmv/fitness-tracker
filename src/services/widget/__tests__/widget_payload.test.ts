import { BuildWidgetPayload, WIDGET_PAYLOAD_MAX_DAYS } from '../widget_payload';
import {
  HealthDataStore,
  HealthDataPoint,
  MetricType,
  MetricUnit,
} from '@types';
import { subDays } from 'date-fns';

describe('BuildWidgetPayload', () => {
  const MakePoint = (daysAgo: number, value: number): HealthDataPoint => ({
    date: subDays(new Date(), daysAgo),
    value,
    metricType: MetricType.STEPS,
    unit: MetricUnit.STEPS,
  });

  const MakeStore = (dataPoints: HealthDataPoint[]): HealthDataStore => ({
    metrics: {
      [MetricType.STEPS]: {
        metricType: MetricType.STEPS,
        unit: MetricUnit.STEPS,
        dataPoints,
        lastSync: new Date(),
      },
    } as HealthDataStore['metrics'],
    exercises: [
      {
        id: 'ex-1',
        date: new Date(),
        type: 'running',
        duration: 30,
        caloriesBurned: 300,
      },
    ],
    lastFullSync: new Date('2026-07-16T10:00:00Z'),
  });

  it('keeps data points within the trim window and drops older ones', () => {
    const recent = MakePoint(10, 100);
    const edge = MakePoint(50, 200);
    const old = MakePoint(500, 300);
    const store = MakeStore([recent, edge, old]);

    const payload = BuildWidgetPayload(store, 60);

    const points = payload.metrics[MetricType.STEPS].dataPoints;
    expect(points).toHaveLength(2);
    expect(points).toContain(recent);
    expect(points).toContain(edge);
    expect(points).not.toContain(old);
  });

  it('drops exercises entirely (widget never renders them)', () => {
    const store = MakeStore([MakePoint(1, 100)]);

    const payload = BuildWidgetPayload(store);

    expect(payload.exercises).toEqual([]);
  });

  it('keeps all metrics with their metadata and lastFullSync', () => {
    const store = MakeStore([MakePoint(1, 100)]);

    const payload = BuildWidgetPayload(store);

    expect(payload.lastFullSync).toEqual(store.lastFullSync);
    expect(payload.metrics[MetricType.STEPS].unit).toBe(MetricUnit.STEPS);
    expect(payload.metrics[MetricType.STEPS].metricType).toBe(MetricType.STEPS);
  });

  it('uses a default window that keeps at least a year of history', () => {
    expect(WIDGET_PAYLOAD_MAX_DAYS).toBeGreaterThanOrEqual(365);

    const yearOld = MakePoint(360, 100);
    const veryOld = MakePoint(3650, 200);
    const payload = BuildWidgetPayload(MakeStore([yearOld, veryOld]));

    const points = payload.metrics[MetricType.STEPS].dataPoints;
    expect(points).toContain(yearOld);
    expect(points).not.toContain(veryOld);
  });

  it('does not mutate the input store', () => {
    const store = MakeStore([MakePoint(1, 100), MakePoint(500, 200)]);
    const originalCount = store.metrics[MetricType.STEPS].dataPoints.length;
    const originalExercises = store.exercises.length;

    BuildWidgetPayload(store, 60);

    expect(store.metrics[MetricType.STEPS].dataPoints).toHaveLength(
      originalCount
    );
    expect(store.exercises).toHaveLength(originalExercises);
  });
});
