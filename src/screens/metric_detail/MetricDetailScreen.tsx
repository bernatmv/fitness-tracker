import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, ButtonGroup } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { ActivityWall } from '@components/activity_wall';
import { LoadingSpinner } from '@components/common';
import { LoadMetricData, LoadUserPreferences } from '@services/storage';
import { MetricType, HealthMetricData, MetricConfig } from '@types';
import { GetDateRange } from '@utils';

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
  const [metricData, setMetricData] = useState<HealthMetricData | null>(null);
  const [config, setConfig] = useState<MetricConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(1); // Default to 30 days
  const [numDays, setNumDays] = useState(30);

  const dateRangeOptions = [7, 30, 90, 365];
  const dateRangeLabels = [
    t('metric_detail.last_7_days'),
    t('metric_detail.last_30_days'),
    t('metric_detail.last_90_days'),
    t('metric_detail.last_year'),
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
    setNumDays(dateRangeOptions[index]);
  };

  const CalculateStatistics = () => {
    if (!metricData || metricData.dataPoints.length === 0) {
      return { average: 0, total: 0, bestDay: 0 };
    }

    const { start } = GetDateRange(numDays);
    const relevantPoints = metricData.dataPoints.filter(
      dp => dp.date >= start
    );

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
            numDays={numDays}
            cellSize={10}
            cellGap={2}
          />
        </View>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>
          {t('metric_detail.statistics')}
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.average.toFixed(0)}</Text>
            <Text style={styles.statLabel}>{t('metric_detail.average')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total.toFixed(0)}</Text>
            <Text style={styles.statLabel}>{t('metric_detail.total')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.bestDay.toFixed(0)}</Text>
            <Text style={styles.statLabel}>{t('metric_detail.best_day')}</Text>
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
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
  },
});

