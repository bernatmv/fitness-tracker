import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, ButtonGroup } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@utils';
import { ActivityWall } from '@components/activity_wall';
import { LoadingSpinner } from '@components/common';
import { LoadMetricData, LoadUserPreferences } from '@services/storage';
import { MetricType, HealthMetricData, MetricConfig } from '@types';
import { GetDateRange, FormatCompactNumber } from '@utils';

interface MetricDetailScreenProps {
  metricType: MetricType;
  onConfigurePress: () => void;
}

/**
 * MetricDetailScreen Component
 * Detailed view of a single metric with statistics
 */
export const MetricDetailScreen: React.FC<MetricDetailScreenProps> = ({
  metricType,
  onConfigurePress,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [metricData, setMetricData] = useState<HealthMetricData | null>(null);
  const [config, setConfig] = useState<MetricConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(1); // Default to 30 days
  const [numDays, setNumDays] = useState<number | null>(30);

  const dateRangeOptions: (number | null)[] = [7, 30, 90, 365, null];
  const dateRangeLabels = [
    t('metric_detail.days_7'),
    t('metric_detail.days_30'),
    t('metric_detail.days_90'),
    t('metric_detail.months_12'),
    t('metric_detail.all'),
  ];

  useEffect(() => {
    LoadData();
  }, [metricType]);

  const LoadData = async () => {
    try {
      setIsLoading(true);
      const [data, prefs] = await Promise.all([
        LoadMetricData(metricType),
        LoadUserPreferences(),
      ]);

      setMetricData(data);
      setConfig(prefs?.metricConfigs[metricType] || null);
    } catch (error) {
      console.error('Error loading metric data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const HandleDateRangeChange = (index: number) => {
    setSelectedIndex(index);
    const selectedOption = dateRangeOptions[index];
    setNumDays(selectedOption);
  };

  const CalculateStatistics = () => {
    if (!metricData || metricData.dataPoints.length === 0) {
      return { average: 0, total: 0, bestDay: 0 };
    }

    let relevantPoints = metricData.dataPoints;
    if (numDays !== null) {
      const { start } = GetDateRange(numDays);
      relevantPoints = relevantPoints.filter(dp => dp.date >= start);
    }

    if (relevantPoints.length === 0) {
      return { average: 0, total: 0, bestDay: 0 };
    }

    const total = relevantPoints.reduce((sum, dp) => sum + dp.value, 0);
    const average = total / relevantPoints.length;
    const bestDay = Math.max(...relevantPoints.map(dp => dp.value));

    return { average, total, bestDay };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = CalculateStatistics();
  const dataPoints = metricData?.dataPoints || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text h3>{config?.displayName || metricType}</Text>
        <Button
          title={t('metric_detail.configure')}
          onPress={onConfigurePress}
          type="outline"
          containerStyle={styles.configButton}
        />
      </View>

      <View style={styles.rangeSelector}>
        <Text style={styles.sectionTitle}>{t('metric_detail.view_range')}</Text>
        <ButtonGroup
          buttons={dateRangeLabels}
          selectedIndex={selectedIndex}
          onPress={HandleDateRangeChange}
          containerStyle={styles.buttonGroup}
        />
      </View>

      {config && dataPoints.length > 0 && (
        <View style={styles.activityWallContainer}>
          <ActivityWall
            dataPoints={dataPoints}
            thresholds={config.colorRange.thresholds}
            colors={config.colorRange.colors}
            numDays={numDays || 365}
            showMonthLabels={true}
            showDayLabels={true}
            showDescription={true}
          />
        </View>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>{t('metric_detail.statistics')}</Text>

        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.statCardBackground },
            ]}>
            <Text
              style={[styles.statValue, { color: theme.colors.text.primary }]}
              numberOfLines={1}>
              {FormatCompactNumber(stats.average)}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: theme.colors.text.secondary },
              ]}>
              {t('metric_detail.average')}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.statCardBackground },
            ]}>
            <Text
              style={[styles.statValue, { color: theme.colors.text.primary }]}
              numberOfLines={1}>
              {FormatCompactNumber(stats.total)}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: theme.colors.text.secondary },
              ]}>
              {t('metric_detail.total')}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.statCardBackground },
            ]}>
            <Text
              style={[styles.statValue, { color: theme.colors.text.primary }]}
              numberOfLines={1}>
              {FormatCompactNumber(stats.bestDay)}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: theme.colors.text.secondary },
              ]}>
              {t('metric_detail.best_day')}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configButton: {
    width: 120,
  },
  rangeSelector: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonGroup: {
    marginBottom: 0,
  },
  activityWallContainer: {
    padding: 16,
    alignItems: 'center',
  },
  statsContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
});
