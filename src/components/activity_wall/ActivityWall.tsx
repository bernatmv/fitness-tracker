import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { HealthDataPoint } from '@types';
import { GetColorForValue } from '@utils';
import { GetDateArray, GetStartOfDay } from '@utils';

interface ActivityWallProps {
  dataPoints: HealthDataPoint[];
  thresholds: number[];
  colors: string[];
  numDays?: number;
  onCellPress?: (date: Date, value: number) => void;
  cellSize?: number;
  cellGap?: number;
}

/**
 * ActivityWall Component
 * Renders a GitHub-like heat map visualization of health data
 */
export const ActivityWall: React.FC<ActivityWallProps> = ({
  dataPoints,
  thresholds,
  colors,
  numDays = 365,
  onCellPress,
  cellSize = 12,
  cellGap = 2,
}) => {
  // Prepare data map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    dataPoints.forEach(dp => {
      const dateKey = GetStartOfDay(dp.date).toISOString().split('T')[0];
      map.set(dateKey, dp.value);
    });
    return map;
  }, [dataPoints]);

  // Generate array of dates to display
  const dates = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - numDays + 1);
    return GetDateArray(GetStartOfDay(startDate), GetStartOfDay(endDate));
  }, [numDays]);

  // Group dates by week
  const weeks = useMemo(() => {
    const weeksArray: Date[][] = [];
    let currentWeek: Date[] = [];

    // Pad the first week if it doesn't start on Sunday
    const firstDayOfWeek = dates[0].getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(new Date(0)); // Placeholder for empty cells
    }

    dates.forEach(date => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [dates]);

  const RenderCell = (date: Date, index: number) => {
    const isPlaceholder = date.getTime() === 0;
    const dateKey = isPlaceholder
      ? ''
      : GetStartOfDay(date).toISOString().split('T')[0];
    const value = isPlaceholder ? 0 : (dataMap.get(dateKey) || 0);
    const backgroundColor = isPlaceholder
      ? 'transparent'
      : GetColorForValue(value, thresholds, colors);

    const HandlePress = () => {
      if (!isPlaceholder && onCellPress) {
        onCellPress(date, value);
      }
    };

    return (
      <TouchableOpacity
        key={`cell-${index}-${dateKey}`}
        testID={`activity-cell-${index}`}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            marginBottom: cellGap,
            backgroundColor,
          },
        ]}
        onPress={HandlePress}
        disabled={isPlaceholder}
        activeOpacity={0.7}
      />
    );
  };

  return (
    <View style={styles.container} testID="activity-wall">
      <View style={styles.weeksContainer}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekColumn}>
            {week.map((date, dayIndex) =>
              RenderCell(date, weekIndex * 7 + dayIndex)
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  weekColumn: {
    flexDirection: 'column',
    gap: 2,
  },
  cell: {
    borderRadius: 2,
  },
});

