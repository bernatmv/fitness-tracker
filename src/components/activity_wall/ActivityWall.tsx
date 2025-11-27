import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  LayoutChangeEvent,
} from 'react-native';
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
  const MIN_MONTH_LABEL_WIDTH = 28;
  const DAY_LABELS = useMemo(
    () =>
      new Map<number, string>([
        [1, 'Mon'],
        [3, 'Wed'],
        [5, 'Fri'],
      ]),
    []
  );
  const labelColumnWidth = 32;
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

  // Prepare data map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    dataPoints.forEach(dp => {
      const dateKey = GetStartOfDay(dp.date).toISOString().split('T')[0];
      map.set(dateKey, dp.value);
    });
    return map;
  }, [dataPoints]);

  const { weeks, displayStart, displayEnd, monthLabels } = useMemo(() => {
    const today = GetStartOfDay(new Date());
    const displayStartDate = new Date(today);
    displayStartDate.setDate(today.getDate() - (numDays - 1));

    const paddedStart = new Date(displayStartDate);
    paddedStart.setDate(paddedStart.getDate() - paddedStart.getDay());

    const paddedEnd = new Date(today);
    paddedEnd.setDate(paddedEnd.getDate() + (6 - paddedEnd.getDay()));

    const allDates = GetDateArray(paddedStart, paddedEnd);
    const weeksArray: Date[][] = [];
    const monthLabelMap = new Map<number, string>();
    let currentWeek: Date[] = [];
    let lastLabeledMonth: number | null = null;

    allDates.forEach(date => {
      currentWeek.push(date);

      if (currentWeek.length === 7) {
        const weekIndex = weeksArray.length;
        const displayDate = currentWeek.find(
          d => d >= displayStartDate && d <= today
        );
        if (displayDate) {
          const month = displayDate.getMonth();
          if (month !== lastLabeledMonth) {
            monthLabelMap.set(
              weekIndex,
              displayDate.toLocaleString(undefined, { month: 'short' })
            );
            lastLabeledMonth = month;
          }
        }

        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return {
      weeks: weeksArray,
      displayStart: displayStartDate,
      displayEnd: today,
      monthLabels: monthLabelMap,
    };
  }, [numDays]);

  const maxWeekColumns = useMemo(() => {
    if (!containerWidth) {
      return weeks.length;
    }
    const gridWidth = containerWidth - labelColumnWidth - cellGap;
    const columnWidth = cellSize + cellGap;
    if (columnWidth <= 0) {
      return weeks.length;
    }
    const maxColumns = Math.floor((gridWidth + cellGap) / columnWidth);
    return Math.max(1, Math.min(maxColumns, weeks.length));
  }, [containerWidth, weeks.length, cellSize, cellGap]);

  const visibleWeeks = useMemo(() => {
    if (weeks.length <= maxWeekColumns) {
      return weeks;
    }
    return weeks.slice(weeks.length - maxWeekColumns);
  }, [weeks, maxWeekColumns]);

  const totalWeeks = weeks.length;

  const visibleMonthLabels = useMemo(() => {
    const startIndex = totalWeeks - visibleWeeks.length;
    const map = new Map<number, string>();
    visibleWeeks.forEach((week, idx) => {
      const absoluteIndex = startIndex + idx;
      const label = monthLabels.get(absoluteIndex);
      if (label) {
        map.set(idx, label);
      }
    });
    return map;
  }, [totalWeeks, visibleWeeks, monthLabels]);

  const displayStartTime = displayStart.getTime();
  const displayEndTime = displayEnd.getTime();

  const effectiveCellSize = useMemo(() => {
    if (!containerWidth || totalWeeks === 0) {
      return cellSize;
    }
    const columns = Math.max(visibleWeeks.length, 1);
    const gridWidth =
      containerWidth - labelColumnWidth - cellGap; /* spacing to grid */
    const totalGapSpace = Math.max(0, columns - 1) * cellGap;
    const availableForCells = gridWidth - totalGapSpace;
    const autoSize = availableForCells / columns;
    const clamped = Math.min(Math.max(autoSize, cellSize), 18);
    return Number.isFinite(clamped) ? clamped : cellSize;
  }, [containerWidth, totalWeeks, visibleWeeks.length, cellSize, cellGap]);

  const dayLabelHeight = effectiveCellSize + cellGap;

  const effectiveThresholds = useMemo(() => {
    if (!dataPoints.length) return thresholds;
    const maxValue = Math.max(...dataPoints.map(dp => dp.value));
    const highestConfigured = thresholds[thresholds.length - 2] ?? 0;
    if (!Number.isFinite(maxValue) || maxValue === 0) {
      return thresholds;
    }
    if (maxValue >= highestConfigured) {
      return thresholds;
    }
    const step = maxValue / (thresholds.length - 1 || 1);
    return thresholds.map((_, idx) =>
      idx === thresholds.length - 1 ? Infinity : idx * step
    );
  }, [dataPoints, thresholds]);

  const renderCell = (date: Date, index: number, isLastRow: boolean) => {
    const currentTime = date.getTime();
    const withinRange =
      currentTime >= displayStartTime && currentTime <= displayEndTime;
    const dateKey = withinRange
      ? GetStartOfDay(date).toISOString().split('T')[0]
      : '';
    const value = withinRange ? dataMap.get(dateKey) || 0 : 0;
    const backgroundColor = withinRange
      ? GetColorForValue(value, effectiveThresholds, colors)
      : 'transparent';

    const HandlePress = () => {
      if (withinRange && onCellPress) {
        onCellPress(date, value);
      }
    };

    const marginBottom = isLastRow ? 0 : cellGap;
    return (
      <TouchableOpacity
        key={`cell-${index}-${dateKey}`}
        testID={`activity-cell-${index}`}
        style={[
          styles.cell,
          {
            width: effectiveCellSize,
            height: effectiveCellSize,
            marginBottom,
            backgroundColor,
          },
        ]}
        onPress={HandlePress}
        disabled={!withinRange}
        activeOpacity={0.7}
      />
    );
  };

  return (
    <View
      style={styles.container}
      testID="activity-wall"
      onLayout={handleLayout}>
      <View style={styles.monthRow}>
        <View style={{ width: labelColumnWidth }} />
        <View
          style={[
            styles.monthLabelsContainer,
            { gap: cellGap, marginLeft: cellGap / 2 },
          ]}>
          {visibleWeeks.map((_, weekIndex) => {
            const label = visibleMonthLabels.get(weekIndex);
            const columnWidth = effectiveCellSize + cellGap;
            return (
              <View
                key={`month-${weekIndex}`}
                style={[styles.monthLabelWrapper, { width: columnWidth }]}>
                {label && (
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.monthLabel,
                      { minWidth: MIN_MONTH_LABEL_WIDTH },
                    ]}>
                    {label}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.gridRow}>
        <View
          style={[
            styles.dayLabelsColumn,
            {
              width: labelColumnWidth,
              marginRight: cellGap,
              height: dayLabelHeight * 7 - cellGap,
            },
          ]}>
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const marginBottom = dayIndex === 6 ? 0 : cellGap;
            return (
              <View
                key={`day-${dayIndex}`}
                style={[
                  styles.dayLabelWrapper,
                  {
                    height: effectiveCellSize,
                    marginBottom,
                  },
                ]}>
                <Text style={styles.dayLabel}>
                  {DAY_LABELS.get(dayIndex) || ' '}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={[styles.weeksContainer, { gap: cellGap }]}>
          {visibleWeeks.map((week, weekIndex) => (
            <View
              key={`week-${weekIndex}`}
              style={styles.weekColumn}
              testID={`week-${weekIndex}`}>
              {week.map((date, dayIndex) =>
                renderCell(
                  date,
                  weekIndex * 7 + dayIndex,
                  dayIndex === week.length - 1
                )
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  monthLabelsContainer: {
    flexDirection: 'row',
  },
  monthLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  monthLabelWrapper: {
    alignItems: 'flex-start',
  },
  weeksContainer: {
    flexDirection: 'row',
  },
  weekColumn: {
    flexDirection: 'column',
  },
  dayLabelsColumn: {
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  dayLabelWrapper: {
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 2,
  },
});
