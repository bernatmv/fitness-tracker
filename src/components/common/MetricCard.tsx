import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Icon } from '@rneui/themed';
import { HealthDataPoint, MetricConfig } from '@types';
import { ActivityWall } from '../activity_wall';
import { useTranslation } from 'react-i18next';
import { FormatNumber, useAppTheme } from '@utils';
import { METRIC_UNITS } from '@constants';
import { GetColorsForMetricConfig } from '@services/theme';

interface MetricCardProps {
  config: MetricConfig;
  dataPoints: HealthDataPoint[];
  onPress?: () => void;
  showMiniWall?: boolean;
  currentValue?: number;
  cardBackgroundColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
  enableMultiRowLayout?: boolean;
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
  cardBackgroundColor,
  textColor,
  secondaryTextColor: customSecondaryTextColor,
  enableMultiRowLayout = false,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();

  // Use cardBackgroundColor if provided (should match home background), otherwise fallback
  const backgroundColor = cardBackgroundColor || theme.colors.background;
  const primaryTextColor = textColor || theme.colors.text.primary;
  const secondaryTextColor =
    customSecondaryTextColor || textColor || theme.colors.text.secondary;
  const borderColor = theme.colors.border;

  const CalculateCurrentValue = () => {
    if (currentValue !== undefined) return currentValue;
    if (dataPoints.length === 0) return 0;

    // Get most recent data point
    const sorted = [...dataPoints].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    return sorted[0]?.value || 0;
  };

  const GetUnit = () => {
    // Use current METRIC_UNITS mapping to ensure correct unit display
    if (dataPoints.length > 0) {
      const sorted = [...dataPoints].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );
      const mostRecent = sorted[0];
      if (mostRecent) {
        return METRIC_UNITS[mostRecent.metricType] || mostRecent.unit;
      }
    }
    // Fallback to unit from config if no data points
    return METRIC_UNITS[config.metricType];
  };

  const value = CalculateCurrentValue();
  const unit = GetUnit();
  const isDarkMode = theme.mode === 'dark';
  const colors = GetColorsForMetricConfig(
    config.colorRange.paletteId,
    isDarkMode
  );

  return (
    <Card containerStyle={[styles.card, { backgroundColor, borderColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: primaryTextColor }]}>
          {config.displayName}
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.value, { color: primaryTextColor }]}>
            {FormatNumber(value, 0)} {unit}
          </Text>
          {onPress && (
            <TouchableOpacity
              onPress={onPress}
              style={styles.arrowButton}
              activeOpacity={0.7}>
              <Icon
                name="chevron-right"
                type="material"
                size={22}
                color={theme.colors.link}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showMiniWall && dataPoints.length > 0 && (
        <View style={styles.miniWall}>
          <ActivityWall
            dataPoints={dataPoints}
            thresholds={config.colorRange.thresholds}
            colors={colors}
            showMonthLabels={false}
            showDayLabels={false}
            showDescription={false}
            enableMultiRowLayout={enableMultiRowLayout}
          />
        </View>
      )}

      {dataPoints.length === 0 && (
        <Text style={[styles.noData, { color: secondaryTextColor }]}>
          {t('home.no_data')}
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
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
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  arrowButton: {
    padding: 4,
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
