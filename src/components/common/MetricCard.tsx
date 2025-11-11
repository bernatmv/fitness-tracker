import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from '@rneui/themed';
import { HealthDataPoint, MetricConfig } from '@types';
import { ActivityWall } from '../activity_wall';
import { useTranslation } from 'react-i18next';

interface MetricCardProps {
  config: MetricConfig;
  dataPoints: HealthDataPoint[];
  onPress?: () => void;
  showMiniWall?: boolean;
  currentValue?: number;
}

/**
 * MetricCard Component
 * Displays a summary card for a single metric
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  config,
  dataPoints,
  onPress,
  showMiniWall = true,
  currentValue,
}) => {
  const { t } = useTranslation();

  const CalculateCurrentValue = () => {
    if (currentValue !== undefined) return currentValue;
    if (dataPoints.length === 0) return 0;
    
    // Get most recent data point
    const sorted = [...dataPoints].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    return sorted[0]?.value || 0;
  };

  const value = CalculateCurrentValue();

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Card containerStyle={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{config.displayName}</Text>
          <Text style={styles.value}>
            {value.toFixed(0)}
          </Text>
        </View>
        
        {showMiniWall && dataPoints.length > 0 && (
          <View style={styles.miniWall}>
            <ActivityWall
              dataPoints={dataPoints}
              thresholds={config.colorRange.thresholds}
              colors={config.colorRange.colors}
              numDays={30}
              cellSize={8}
              cellGap={1}
            />
          </View>
        )}
        
        {dataPoints.length === 0 && (
          <Text style={styles.noData}>{t('home.no_data')}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  miniWall: {
    marginTop: 8,
  },
  noData: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 8,
  },
});

