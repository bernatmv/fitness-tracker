import { GetMetricDisplayName } from '../metric_utils';
import { MetricType } from '@types';

describe('GetMetricDisplayName', () => {
  const MakeT = (translations: Record<string, string>) =>
    ((key: string, options?: { defaultValue?: string }) =>
      translations[key] ?? options?.defaultValue ?? key) as Parameters<
      typeof GetMetricDisplayName
    >[1];

  it('returns the translated name for the metric type', () => {
    const t = MakeT({ 'metrics.calories_burned': 'Calorías Quemadas' });

    const result = GetMetricDisplayName(
      {
        metricType: MetricType.CALORIES_BURNED,
        displayName: 'Calories Burned',
      },
      t
    );

    expect(result).toBe('Calorías Quemadas');
  });

  it('builds the translation key from the metric type in lowercase', () => {
    const t = MakeT({ 'metrics.sleep_hours': 'Hours of Sleep' });

    const result = GetMetricDisplayName(
      { metricType: MetricType.SLEEP_HOURS, displayName: 'Sleep' },
      t
    );

    expect(result).toBe('Hours of Sleep');
  });

  it('falls back to the stored displayName when no translation exists', () => {
    const t = MakeT({});

    const result = GetMetricDisplayName(
      { metricType: MetricType.STEPS, displayName: 'My Custom Steps' },
      t
    );

    expect(result).toBe('My Custom Steps');
  });
});
