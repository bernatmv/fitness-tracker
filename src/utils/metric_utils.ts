import type { TFunction } from 'i18next';
import { MetricConfig } from '@types';

/**
 * Get the localized display name for a metric.
 * Falls back to the displayName stored in the config when no translation exists
 * (e.g., custom metrics or missing locale keys).
 */
export const GetMetricDisplayName = (
  config: Pick<MetricConfig, 'metricType' | 'displayName'>,
  t: TFunction
): string => {
  return t(`metrics.${config.metricType.toLowerCase()}`, {
    defaultValue: config.displayName,
  });
};
