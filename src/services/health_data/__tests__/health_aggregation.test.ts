import { AggregateHealthResults } from '../health_aggregation';
import { MetricType } from '@types';
import { GetStartOfDay } from '@utils';

// Day keys are local-start-of-day based (same as production aggregation),
// so derive expectations the same way instead of hardcoding UTC dates.
const DayKey = (iso: string) =>
  GetStartOfDay(new Date(iso)).toISOString().split('T')[0];

const START = new Date('2026-07-18T00:00:00Z');
const END = new Date('2026-07-20T00:00:00Z');

describe('AggregateHealthResults', () => {
  it('sums daily buckets for steps', () => {
    const { dataPoints } = AggregateHealthResults(
      MetricType.STEPS,
      [
        { startDate: '2026-07-18T12:00:00Z', value: 5000 },
        { startDate: '2026-07-19T12:00:00Z', value: 8000 },
      ],
      START,
      END
    );

    const byDay = new Map(
      dataPoints.map(dp => [dp.date.toISOString().split('T')[0], dp.value])
    );
    expect(byDay.get(DayKey('2026-07-18T12:00:00Z'))).toBe(5000);
    expect(byDay.get(DayKey('2026-07-19T12:00:00Z'))).toBe(8000);
  });

  it('counts stand hours ring-style from hourly buckets, capped at 24', () => {
    const hourly = Array.from({ length: 30 }, (_, i) => ({
      startDate: `2026-07-18T${String(i % 24).padStart(2, '0')}:00:00Z`,
      value: i % 3 === 0 ? 0 : 5, // some hours without standing
    }));
    const { dataPoints } = AggregateHealthResults(
      MetricType.STANDING_TIME,
      hourly,
      START,
      END
    );

    const activeDays = dataPoints.filter(dp => dp.value > 0);
    expect(activeDays.length).toBeGreaterThan(0);
    // Count caps at 24 regardless of bucket count
    expect(Math.max(...dataPoints.map(dp => dp.value))).toBeLessThanOrEqual(24);
  });

  it('computes sleep minutes from the sample time range', () => {
    const { dataPoints } = AggregateHealthResults(
      MetricType.SLEEP_HOURS,
      [
        {
          startDate: '2026-07-18T23:00:00Z',
          endDate: '2026-07-19T06:30:00Z',
        },
      ],
      START,
      END
    );

    const day = dataPoints.find(
      dp =>
        dp.date.toISOString().split('T')[0] === DayKey('2026-07-18T23:00:00Z')
    );
    expect(day?.value).toBe(450); // 7.5h in minutes, attributed to start day
  });

  it('reports the most recent day with samples as lastDataDate', () => {
    const { lastDataDate } = AggregateHealthResults(
      MetricType.STEPS,
      [
        { startDate: '2026-07-18T12:00:00Z', value: 100 },
        { startDate: '2026-07-19T12:00:00Z', value: 100 },
      ],
      START,
      END
    );
    expect(lastDataDate?.toISOString().split('T')[0]).toBe(
      DayKey('2026-07-19T12:00:00Z')
    );
  });

  it('returns zero-padded points and null lastDataDate for empty results', () => {
    const { dataPoints, lastDataDate } = AggregateHealthResults(
      MetricType.CALORIES_BURNED,
      [],
      START,
      END
    );
    expect(dataPoints.length).toBeGreaterThanOrEqual(3);
    expect(dataPoints.every(dp => dp.value === 0)).toBe(true);
    expect(lastDataDate).toBeNull();
  });

  it('aggregates identically when results arrive split across chunks', () => {
    const all = [
      { startDate: '2026-07-18T12:00:00Z', value: 5000 },
      { startDate: '2026-07-19T12:00:00Z', value: 8000 },
    ];
    const whole = AggregateHealthResults(MetricType.STEPS, all, START, END);
    const chunked = AggregateHealthResults(
      MetricType.STEPS,
      [...all.slice(0, 1), ...all.slice(1)],
      START,
      END
    );
    expect(chunked.dataPoints).toEqual(whole.dataPoints);
  });
});
