import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  LayoutChangeEvent,
} from 'react-native';
import { format } from 'date-fns';
import { HealthDataPoint, MetricUnit } from '@types';
import { GetColorForValue, FormatNumber } from '@utils';
import { GetDateArray, GetStartOfDay } from '@utils';
import { METRIC_UNITS } from '@constants';

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
  cellGap = 5,
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (Math.abs(width - containerWidth) > 1) {
        setContainerWidth(width);
      }
    },
    [containerWidth]
  );

  // Prepare data map for quick lookup (value and unit)
  // Use current METRIC_UNITS mapping to ensure correct unit display
  const dataMap = useMemo(() => {
    const map = new Map<string, { value: number; unit: MetricUnit }>();
    dataPoints.forEach(dp => {
      const dateKey = GetStartOfDay(dp.date).toISOString().split('T')[0];
      // Use the current unit mapping to ensure consistency (handles unit changes)
      const currentUnit = METRIC_UNITS[dp.metricType] || dp.unit;
      map.set(dateKey, { value: dp.value, unit: currentUnit });
    });
    return map;
  }, [dataPoints]);

  const { weeks, displayStart, displayEnd } = useMemo(() => {
    const today = GetStartOfDay(new Date());
    const displayStartDate = new Date(today);
    displayStartDate.setDate(today.getDate() - (numDays - 1));

    const paddedStart = new Date(displayStartDate);
    paddedStart.setDate(paddedStart.getDate() - paddedStart.getDay());

    const paddedEnd = new Date(today);
    paddedEnd.setDate(paddedEnd.getDate() + (6 - paddedEnd.getDay()));

    const allDates = GetDateArray(paddedStart, paddedEnd);
    const weeksArray: Date[][] = [];
    let currentWeek: Date[] = [];

    allDates.forEach(date => {
      currentWeek.push(date);

      if (currentWeek.length === 7) {
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
      monthLabels: new Map<number, string>(),
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

  const displayStartTime = displayStart.getTime();
  const displayEndTime = displayEnd.getTime();

  const visibleMonthLabels = useMemo(() => {
    const map = new Map<number, string>();
    const monthsSeen = new Set<string>();

    // Find the first day of each month in the visible range
    visibleWeeks.forEach(week => {
      week.forEach(date => {
        if (
          date.getTime() >= displayStartTime &&
          date.getTime() <= displayEndTime
        ) {
          const month = date.getMonth();
          const year = date.getFullYear();
          const monthKey = `${year}-${month}`;

          // Check if this is the first day of this month we've seen
          if (!monthsSeen.has(monthKey)) {
            // Check if this date is the first of the month, or the first visible day of this month
            const isFirstOfMonth = date.getDate() === 1;
            const firstOfMonth = new Date(year, month, 1);
            const isFirstVisible =
              firstOfMonth.getTime() < displayStartTime &&
              date.getTime() >= displayStartTime;

            if (isFirstOfMonth || isFirstVisible) {
              // Find which week contains this date
              let targetWeekIdx = -1;
              visibleWeeks.forEach((w, wIdx) => {
                if (w.some(d => d.getTime() === date.getTime())) {
                  targetWeekIdx = wIdx;
                }
              });

              if (targetWeekIdx !== -1 && !map.has(targetWeekIdx)) {
                const monthName = date.toLocaleString(undefined, {
                  month: 'short',
                });
                map.set(targetWeekIdx, monthName);
                monthsSeen.add(monthKey);
              }
            }
          }
        }
      });
    });

    return map;
  }, [visibleWeeks, displayStartTime, displayEndTime]);

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

  const monthLabelOffsets = useMemo(() => {
    const offsets = new Map<number, number>();

    visibleMonthLabels.forEach((label, weekIdx) => {
      const week = visibleWeeks[weekIdx];
      if (!week) {
        offsets.set(weekIdx, 0);
        return;
      }

      // Find the first day of this month in the visible range
      let firstDayOfMonth: Date | null = null;
      let targetMonth = -1;
      let targetYear = -1;

      // Determine which month this label represents by finding it in all visible weeks
      visibleWeeks.forEach(w => {
        w.forEach(date => {
          if (
            date.getTime() >= displayStartTime &&
            date.getTime() <= displayEndTime
          ) {
            const month = date.getMonth();
            const year = date.getFullYear();
            const monthName = date.toLocaleString(undefined, {
              month: 'short',
            });
            if (monthName === label && targetMonth === -1) {
              targetMonth = month;
              targetYear = year;
            }
          }
        });
      });

      if (targetMonth === -1) {
        offsets.set(weekIdx, 0);
        return;
      }

      // Find the first day of this month in the visible range
      visibleWeeks.forEach(w => {
        w.forEach(d => {
          if (
            d.getTime() >= displayStartTime &&
            d.getTime() <= displayEndTime &&
            d.getMonth() === targetMonth &&
            d.getFullYear() === targetYear
          ) {
            if (!firstDayOfMonth || d < firstDayOfMonth) {
              firstDayOfMonth = d;
            }
          }
        });
      });

      if (!firstDayOfMonth) {
        offsets.set(weekIdx, 0);
        return;
      }

      // Check if the first day is in this week
      if (!firstDayOfMonth) {
        offsets.set(weekIdx, 0);
        return;
      }

      const firstDay: Date = firstDayOfMonth;
      const dayInWeek = week.findIndex(d => d.getTime() === firstDay.getTime());

      if (dayInWeek !== -1) {
        // Calculate offset: day of week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = firstDay.getDay();
        // Convert to Monday-based (0 = Monday, 6 = Sunday)
        const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        offsets.set(weekIdx, mondayBasedDay * (effectiveCellSize + cellGap));
      } else {
        offsets.set(weekIdx, 0);
      }
    });

    return offsets;
  }, [
    visibleWeeks,
    visibleMonthLabels,
    displayStartTime,
    displayEndTime,
    effectiveCellSize,
    cellGap,
  ]);

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
    const data = withinRange ? dataMap.get(dateKey) : null;
    const value = data?.value || 0;
    const backgroundColor = withinRange
      ? GetColorForValue(value, effectiveThresholds, colors)
      : 'transparent';

    const isSelected =
      selectedDate &&
      GetStartOfDay(selectedDate).toISOString().split('T')[0] === dateKey;

    const HandlePress = () => {
      if (withinRange) {
        setSelectedDate(date);
        if (onCellPress) {
          onCellPress(date, value);
        }
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
          isSelected && styles.cellSelected,
        ]}
        onPress={HandlePress}
        disabled={!withinRange}
        activeOpacity={0.7}
      />
    );
  };

  const selectedData = useMemo(() => {
    if (!selectedDate) return null;
    const dateKey = GetStartOfDay(selectedDate).toISOString().split('T')[0];
    return dataMap.get(dateKey) || null;
  }, [selectedDate, dataMap]);

  const formatValue = (val: number, unit: MetricUnit): string => {
    const formattedValue = FormatNumber(val, 0);
    return `${formattedValue} ${unit}`;
  };

  const formatSelectedDate = (date: Date): string => {
    return format(date, 'MMM do');
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
            const offset = monthLabelOffsets.get(weekIndex) || 0;
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
                      {
                        minWidth: MIN_MONTH_LABEL_WIDTH,
                        marginLeft: offset,
                      },
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
      {selectedDate && selectedData && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {formatValue(selectedData.value, selectedData.unit)} on{' '}
            {formatSelectedDate(selectedDate)}
          </Text>
        </View>
      )}
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
  cellSelected: {
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  descriptionContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
