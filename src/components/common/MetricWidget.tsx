import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Text } from '@rneui/themed';
import { HealthDataPoint, MetricConfig } from '@types';
import { ActivityWall } from '../activity_wall';
import { FormatNumber, useAppTheme } from '@utils';
import { METRIC_UNITS } from '@constants';
import { GetColorsForMetricConfig } from '@services/theme';

interface MetricWidgetProps {
  config: MetricConfig;
  dataPoints: HealthDataPoint[];
  showCurrentValue?: boolean;
  backgroundColor?: string;
  textColor?: string;
  enableMultiRowLayout?: boolean;
}

// Constants matching ActivityWall
const CELL_SIZE = 12;
const CELL_GAP = 5;
const CONTAINER_PADDING = 32; // 16px left + 16px right
const MIN_DAYS = 7; // Minimum days to show
const MAX_DAYS = 365; // Maximum days to show

/**
 * Calculates the number of days that fit in the available width
 */
const CalculateNumDaysFromWidth = (containerWidth: number): number => {
  if (containerWidth <= 0) {
    return MIN_DAYS;
  }

  // Available width for the grid (container width minus padding)
  const availableWidth = containerWidth - CONTAINER_PADDING;
  
  // Width of one week column (7 cells + gaps)
  const columnWidth = CELL_SIZE + CELL_GAP;
  
  if (columnWidth <= 0) {
    return MIN_DAYS;
  }

  // Calculate maximum number of week columns that fit
  const maxWeekColumns = Math.floor((availableWidth + CELL_GAP) / columnWidth);
  
  // Convert weeks to days (ensure minimum of 7 days)
  const numDays = Math.max(MIN_DAYS, maxWeekColumns * 7);
  
  // Cap at maximum
  return Math.min(numDays, MAX_DAYS);
};

/**
 * MetricWidget Component
 * Displays a non-interactive activity wall widget for a specific metric
 * Automatically calculates the number of days to display based on widget container size
 */
export const MetricWidget: React.FC<MetricWidgetProps> = ({
  config,
  dataPoints,
  showCurrentValue = false,
  backgroundColor,
  textColor,
  enableMultiRowLayout = false,
}) => {
  const theme = useAppTheme();
  const isDarkMode = theme.mode === 'dark';
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (Math.abs(width - containerWidth) > 1) {
        setContainerWidth(width);
      }
    },
    [containerWidth]
  );

  // Calculate number of days based on container width
  const numDays = useMemo(() => {
    return CalculateNumDaysFromWidth(containerWidth);
  }, [containerWidth]);

  const primaryTextColor = textColor || theme.colors.text.primary;
  const widgetBackgroundColor =
    backgroundColor || theme.colors.background;

  const CalculateCurrentValue = (): number => {
    if (dataPoints.length === 0) return 0;

    // Get most recent data point
    const sorted = [...dataPoints].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    return sorted[0]?.value || 0;
  };

  const GetUnit = (): string => {
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
  const colors = GetColorsForMetricConfig(
    config.colorRange.paletteId,
    isDarkMode
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: widgetBackgroundColor },
      ]}
      onLayout={handleLayout}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: primaryTextColor }]}>
          {config.displayName}
        </Text>
        {showCurrentValue && (
          <Text style={[styles.value, { color: primaryTextColor }]}>
            {FormatNumber(value, 0)} {unit}
          </Text>
        )}
      </View>

      {dataPoints.length > 0 && (
        <View style={styles.activityWall}>
          <ActivityWall
            dataPoints={dataPoints}
            thresholds={config.colorRange.thresholds}
            colors={colors}
            numDays={numDays}
            showMonthLabels={false}
            showDayLabels={false}
            showDescription={false}
            enableMultiRowLayout={enableMultiRowLayout}
            interactive={false}
          />
        </View>
      )}

      {dataPoints.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.noData, { color: theme.colors.text.secondary }]}>
            No data available
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
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
  value: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  activityWall: {
    marginTop: 8,
  },
  emptyState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noData: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.6,
  },
});

