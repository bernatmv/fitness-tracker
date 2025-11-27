import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  LayoutChangeEvent,
} from 'react-native';
import { format } from 'date-fns';
import { HealthDataPoint, MetricUnit } from '@types';
import {
  GetColorForValue,
  FormatNumber,
  useAppTheme,
  DarkenColor,
} from '@utils';
import { GetDateArray, GetStartOfDay } from '@utils';
import { METRIC_UNITS } from '@constants';

const MONTH_LABEL_WIDTH = 24;
const CELL_SIZE = 12;
const CELL_GAP = 5;

interface ActivityWallProps {
  dataPoints: HealthDataPoint[];
  thresholds: number[];
  colors: string[];
  numDays?: number;
  onCellPress?: (date: Date, value: number) => void;
  showMonthLabels?: boolean;
  showDayLabels?: boolean;
  showDescription?: boolean;
  enableMultiRowLayout?: boolean;
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
  showMonthLabels = true,
  showDayLabels = true,
  showDescription = true,
  enableMultiRowLayout = false,
}) => {
  const theme = useAppTheme();

  // Darken the base color (first color) in dark mode
  const adjustedColors = useMemo(() => {
    if (theme.mode === 'dark' && colors.length > 0) {
      const adjusted = [...colors];
      // Darken the first color (base color) for dark mode
      adjusted[0] = DarkenColor(colors[0], 60);
      return adjusted;
    }
    return colors;
  }, [colors, theme.mode]);

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

  // Reset selected date when numDays changes
  useEffect(() => {
    setSelectedDate(null);
  }, [numDays]);

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
    const effectiveLabelColumnWidth = showDayLabels ? labelColumnWidth : 0;
    const gridWidth =
      containerWidth -
      effectiveLabelColumnWidth -
      (showDayLabels ? CELL_GAP : 0);
    const columnWidth = CELL_SIZE + CELL_GAP;
    if (columnWidth <= 0) {
      return weeks.length;
    }
    const maxColumns = Math.floor((gridWidth + CELL_GAP) / columnWidth);
    return Math.max(1, maxColumns);
  }, [containerWidth, showDayLabels, weeks.length]);

  // Split weeks into multiple rows (if enabled) or show only recent weeks (old behavior)
  const weekRows = useMemo(() => {
    if (enableMultiRowLayout) {
      // Multi-row: start from newest weeks, fill first row completely, then distribute rest
      const rows: Date[][][] = [];
      let remainingWeeks = [...weeks];

      // Build rows from newest to oldest
      // First row: take as many weeks as possible (up to maxWeekColumns) from the end
      if (remainingWeeks.length > 0) {
        const firstRowSize = Math.min(maxWeekColumns, remainingWeeks.length);
        rows.unshift(remainingWeeks.slice(-firstRowSize));
        remainingWeeks = remainingWeeks.slice(0, -firstRowSize);
      }

      // Remaining rows: distribute the rest of the weeks (oldest weeks)
      while (remainingWeeks.length > 0) {
        const rowSize = Math.min(maxWeekColumns, remainingWeeks.length);
        rows.unshift(remainingWeeks.slice(-rowSize));
        remainingWeeks = remainingWeeks.slice(0, -rowSize);
      }

      // rows is now [oldest rows, ..., newest row]
      // Reverse so newest is first (top row)
      return rows.reverse();
    } else {
      // Single-row: show only the most recent weeks that fit
      const visibleWeeks =
        weeks.length <= maxWeekColumns
          ? weeks
          : weeks.slice(weeks.length - maxWeekColumns);
      return [visibleWeeks];
    }
  }, [weeks, maxWeekColumns, enableMultiRowLayout]);

  const totalWeeks = weeks.length;

  const displayStartTime = useMemo(
    () => displayStart.getTime(),
    [displayStart]
  );
  const displayEndTime = useMemo(() => displayEnd.getTime(), [displayEnd]);

  const visibleMonthLabels = useMemo(() => {
    const map = new Map<number, string>();
    const monthsSeen = new Set<string>();

    // Find the first day of each month across all weeks
    weeks.forEach(week => {
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
              // Find which week contains this date (absolute index across all weeks)
              let targetWeekIdx = -1;
              weeks.forEach((w, wIdx) => {
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
  }, [weeks, displayStartTime, displayEndTime]);

  const effectiveLabelColumnWidth = showDayLabels ? labelColumnWidth : 0;

  const effectiveCellSize = useMemo(() => {
    if (!containerWidth || totalWeeks === 0) {
      return CELL_SIZE;
    }

    const columns = Math.max(maxWeekColumns, 1);
    const gridWidth =
      containerWidth -
      effectiveLabelColumnWidth -
      (showDayLabels ? CELL_GAP : 0);
    const totalGapSpace = Math.max(0, columns - 1) * CELL_GAP;
    const availableForCells = gridWidth - totalGapSpace;
    const autoSize = availableForCells / columns;
    const clamped = Math.min(Math.max(autoSize, CELL_SIZE), 18);
    return Number.isFinite(clamped) ? clamped : CELL_SIZE;
  }, [
    containerWidth,
    totalWeeks,
    maxWeekColumns,
    effectiveLabelColumnWidth,
    showDayLabels,
  ]);

  const dayLabelHeight = effectiveCellSize + CELL_GAP;

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
      ? GetColorForValue(value, effectiveThresholds, adjustedColors)
      : 'transparent';

    const isSelected =
      selectedDate &&
      GetStartOfDay(selectedDate).toISOString().split('T')[0] === dateKey;

    const HandlePress = () => {
      if (withinRange) {
        if (isSelected) {
          // Deselect if already selected
          setSelectedDate(null);
        } else {
          // Select the cell
          setSelectedDate(date);
          if (onCellPress) {
            onCellPress(date, value);
          }
        }
      }
    };

    const marginBottom = isLastRow ? 0 : CELL_GAP;
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
          isSelected && [
            styles.cellSelected,
            { borderColor: theme.colors.cellSelectedBorder },
          ],
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
    return format(date, 'MMM do, yyyy');
  };

  return (
    <View
      style={styles.container}
      testID="activity-wall"
      onLayout={handleLayout}>
      {showMonthLabels && (
        <View style={styles.monthRow}>
          <View style={{ width: effectiveLabelColumnWidth }} />
          <View
            style={[styles.monthLabelsContainer, { marginLeft: CELL_GAP / 2 }]}>
            {enableMultiRowLayout
              ? weeks.map((_, weekIndex) => {
                  const label = visibleMonthLabels.get(weekIndex);
                  const columnWidth = CELL_SIZE + CELL_GAP;
                  return (
                    <View
                      key={`month-${weekIndex}`}
                      style={[
                        styles.monthLabelWrapper,
                        {
                          width: columnWidth,
                          minWidth: columnWidth,
                          maxWidth: columnWidth,
                        },
                      ]}>
                      {label && (
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.monthLabel,
                            {
                              width: MONTH_LABEL_WIDTH,
                              marginLeft: CELL_GAP / 2,
                              color: theme.colors.activityLabel,
                            },
                          ]}>
                          {label}
                        </Text>
                      )}
                    </View>
                  );
                })
              : weekRows[0]?.map((_, weekIndex) => {
                  // For single-row, map to absolute week index
                  const absoluteWeekIndex =
                    weeks.length <= maxWeekColumns
                      ? weekIndex
                      : weeks.length - maxWeekColumns + weekIndex;
                  const label = visibleMonthLabels.get(absoluteWeekIndex);
                  const columnWidth = CELL_SIZE + CELL_GAP;
                  return (
                    <View
                      key={`month-${weekIndex}`}
                      style={[
                        styles.monthLabelWrapper,
                        {
                          width: columnWidth,
                          minWidth: columnWidth,
                          maxWidth: columnWidth,
                        },
                      ]}>
                      {label && (
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.monthLabel,
                            {
                              width: MONTH_LABEL_WIDTH,
                              marginLeft: CELL_GAP / 2,
                              color: theme.colors.activityLabel,
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
      )}
      <View style={styles.weeksGrid}>
        {weekRows.map((row, rowIndex) => {
          // Calculate absolute week index accounting for reversed row order
          // When reversed, rowIndex 0 is the newest weeks (first row with max columns)
          let absoluteWeekIndex: number;
          if (enableMultiRowLayout) {
            // Calculate absolute index by summing up weeks in previous rows
            let weekCount = 0;
            for (let i = weekRows.length - 1; i > rowIndex; i--) {
              weekCount += weekRows[i].length;
            }
            absoluteWeekIndex = weekCount;
          } else {
            // Single row: use the visible weeks offset
            absoluteWeekIndex =
              weeks.length <= maxWeekColumns
                ? rowIndex * maxWeekColumns
                : weeks.length - maxWeekColumns + rowIndex * maxWeekColumns;
          }
          return (
            <View key={`row-${rowIndex}`} style={styles.gridRow}>
              {showDayLabels && (
                <View
                  style={[
                    styles.dayLabelsColumn,
                    {
                      width: labelColumnWidth,
                      marginRight: CELL_GAP,
                      height: dayLabelHeight * 7 - CELL_GAP,
                    },
                  ]}>
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const marginBottom = dayIndex === 6 ? 0 : CELL_GAP;
                    return (
                      <View
                        key={`day-${rowIndex}-${dayIndex}`}
                        style={[
                          styles.dayLabelWrapper,
                          {
                            height: effectiveCellSize,
                            marginBottom,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.dayLabel,
                            { color: theme.colors.activityLabel },
                          ]}>
                          {DAY_LABELS.get(dayIndex) || ' '}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
              <View
                style={[
                  styles.weeksContainer,
                  { gap: CELL_GAP },
                  enableMultiRowLayout &&
                    rowIndex === weekRows.length - 1 &&
                    row.length < maxWeekColumns && {
                      paddingLeft:
                        (maxWeekColumns - row.length) *
                        (effectiveCellSize + CELL_GAP),
                    },
                ]}>
                {row.map(week => {
                  const currentAbsoluteWeekIndex = absoluteWeekIndex++;
                  return (
                    <View
                      key={`week-${currentAbsoluteWeekIndex}`}
                      style={styles.weekColumn}
                      testID={`week-${currentAbsoluteWeekIndex}`}>
                      {week.map((date, dayIndex) =>
                        renderCell(
                          date,
                          currentAbsoluteWeekIndex * 7 + dayIndex,
                          dayIndex === week.length - 1
                        )
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
      {(showDescription || (selectedDate && selectedData)) && (
        <View style={styles.descriptionContainer}>
          <Text
            style={[
              styles.descriptionText,
              { color: theme.colors.activityLabel },
            ]}>
            {selectedDate && selectedData
              ? `${formatValue(selectedData.value, selectedData.unit)} on ${formatSelectedDate(selectedDate)}`
              : (() => {
                  const visibleDataPoints = dataPoints.filter(
                    dp =>
                      dp.date.getTime() >= displayStartTime &&
                      dp.date.getTime() <= displayEndTime
                  );
                  if (visibleDataPoints.length === 0) {
                    return 'No data';
                  }
                  const total = visibleDataPoints.reduce(
                    (sum, dp) => sum + dp.value,
                    0
                  );
                  const firstPoint = visibleDataPoints[0];
                  const unit =
                    METRIC_UNITS[firstPoint.metricType] || firstPoint.unit;
                  return formatValue(total, unit);
                })()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  weeksGrid: {
    flexDirection: 'column',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  },
  dayLabelWrapper: {
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 2,
  },
  cellSelected: {
    borderWidth: 2,
  },
  descriptionContainer: {
    marginTop: 12,
    alignItems: 'center',
    minHeight: 20,
    justifyContent: 'center',
  },
  descriptionText: {
    fontSize: 12,
  },
});
