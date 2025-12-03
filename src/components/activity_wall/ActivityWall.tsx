import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  LayoutChangeEvent,
} from 'react-native';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { HealthDataPoint, MetricUnit } from '@types';
import { GetColorForValue, FormatNumber, useAppTheme } from '@utils';
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
  splitByYear?: boolean;
  interactive?: boolean;
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
  splitByYear = false,
  interactive = true,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();

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

  const FALLBACK_MAX_COLUMNS = 12;

  const maxWeekColumns = useMemo(() => {
    if (!containerWidth) {
      return Math.min(weeks.length, FALLBACK_MAX_COLUMNS);
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

  // Structure to hold row data with optional year label
  interface RowData {
    weeks: (Date | null)[][]; // Weeks can contain null dates for proper weekday alignment
    year?: number; // Year label to show before this row
    isLastRowOfYear?: boolean; // Whether this is the last row for its year (for right alignment)
  }

  // Split weeks into multiple rows (if enabled) or show only recent weeks (old behavior)
  const weekRowsData = useMemo(() => {
    if (enableMultiRowLayout) {
      if (splitByYear) {
        // Split by year: split weeks at year boundaries and group by year
        const rowsData: RowData[] = [];
        const yearGroups: Map<number, (Date | null)[][]> = new Map();

        // Split weeks at year boundaries and group by year
        weeks.forEach(week => {
          if (week.length === 0) return;

          // Check if week spans multiple years
          const firstYear = week[0].getFullYear();
          const lastYear = week[week.length - 1].getFullYear();

          if (firstYear === lastYear) {
            // Week is entirely within one year
            if (!yearGroups.has(firstYear)) {
              yearGroups.set(firstYear, []);
            }
            yearGroups.get(firstYear)!.push(week);
          } else {
            // Week spans year boundary - split it while maintaining weekday alignment
            // Create padded arrays of 7 elements (null for missing days)
            const firstYearWeek: (Date | null)[] = new Array(7).fill(null);
            const secondYearWeek: (Date | null)[] = new Array(7).fill(null);

            // The week array is already correctly ordered (Sunday=0, Monday=1, etc.)
            // We need to preserve the original dayIndex to maintain alignment
            week.forEach((date, dayIndex) => {
              // Verify that dayIndex matches the day of week for correctness
              // (week array starts on Sunday, so dayIndex 0 = Sunday = getDay() 0)
              if (date.getFullYear() === firstYear) {
                firstYearWeek[dayIndex] = date;
              } else {
                secondYearWeek[dayIndex] = date;
              }
            });

            // Convert to Date[][] format (filter out nulls but maintain structure)
            // For the first year part, keep the array with nulls for proper alignment
            const firstYearDates: (Date | null)[] = firstYearWeek;
            // For the second year part, keep the array with nulls for proper alignment
            const secondYearDates: (Date | null)[] = secondYearWeek;

            // Add first year part if it has any dates
            if (firstYearDates.some(d => d !== null)) {
              if (!yearGroups.has(firstYear)) {
                yearGroups.set(firstYear, []);
              }
              // Keep nulls for proper weekday alignment in rendering
              yearGroups
                .get(firstYear)!
                .push(firstYearDates as (Date | null)[]);
            }

            // Add second year part if it has any dates
            if (secondYearDates.some(d => d !== null)) {
              if (!yearGroups.has(lastYear)) {
                yearGroups.set(lastYear, []);
              }
              // Keep nulls for proper weekday alignment in rendering
              yearGroups
                .get(lastYear)!
                .push(secondYearDates as (Date | null)[]);
            }
          }
        });

        // Process years from newest to oldest
        const sortedYears = Array.from(yearGroups.keys()).sort((a, b) => b - a);

        sortedYears.forEach((year, yearIndex) => {
          const yearWeeks = yearGroups.get(year)!;
          let remainingYearWeeks = [...yearWeeks];
          const isNewestYear = yearIndex === 0;

          // First row of the year: take as many weeks as possible (up to maxWeekColumns)
          if (remainingYearWeeks.length > 0) {
            const firstRowSize = Math.min(
              maxWeekColumns,
              remainingYearWeeks.length
            );
            const isLastRow = remainingYearWeeks.length <= maxWeekColumns;
            rowsData.unshift({
              weeks: remainingYearWeeks.slice(-firstRowSize),
              // Show year label before first row of each year (except the newest)
              year: isNewestYear ? undefined : year,
              // Mark as last row of year if it's the only row or the last one
              isLastRowOfYear: isLastRow,
            });
            remainingYearWeeks = remainingYearWeeks.slice(0, -firstRowSize);
          }

          // Remaining rows for this year
          while (remainingYearWeeks.length > 0) {
            const rowSize = Math.min(maxWeekColumns, remainingYearWeeks.length);
            const isLastRow = remainingYearWeeks.length <= rowSize;
            rowsData.unshift({
              weeks: remainingYearWeeks.slice(-rowSize),
              isLastRowOfYear: isLastRow,
            });
            remainingYearWeeks = remainingYearWeeks.slice(0, -rowSize);
          }
        });

        // rowsData is now [oldest rows, ..., newest row]
        // Reverse so newest is first (top row)
        return rowsData.reverse();
      } else {
        // Multi-row: start from newest weeks, fill first row completely, then distribute rest
        const rowsData: RowData[] = [];
        let remainingWeeks = [...weeks];

        // Build rows from newest to oldest
        // First row: take as many weeks as possible (up to maxWeekColumns) from the end
        if (remainingWeeks.length > 0) {
          const firstRowSize = Math.min(maxWeekColumns, remainingWeeks.length);
          rowsData.unshift({
            weeks: remainingWeeks.slice(-firstRowSize),
          });
          remainingWeeks = remainingWeeks.slice(0, -firstRowSize);
        }

        // Remaining rows: distribute the rest of the weeks (oldest weeks)
        while (remainingWeeks.length > 0) {
          const rowSize = Math.min(maxWeekColumns, remainingWeeks.length);
          rowsData.unshift({
            weeks: remainingWeeks.slice(-rowSize),
          });
          remainingWeeks = remainingWeeks.slice(0, -rowSize);
        }

        // rowsData is now [oldest rows, ..., newest row]
        // Reverse so newest is first (top row)
        return rowsData.reverse();
      }
    } else {
      // Single-row: show only the most recent weeks that fit
      const visibleWeeks =
        weeks.length <= maxWeekColumns
          ? weeks
          : weeks.slice(weeks.length - maxWeekColumns);
      return [{ weeks: visibleWeeks }];
    }
  }, [weeks, maxWeekColumns, enableMultiRowLayout, splitByYear]);

  // Extract just the weeks arrays for backward compatibility
  const weekRows = useMemo(
    () => weekRowsData.map(rowData => rowData.weeks),
    [weekRowsData]
  );

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

  const renderCell = (date: Date | null, index: number, isLastRow: boolean) => {
    // Handle null dates (for split weeks maintaining weekday alignment)
    if (date === null) {
      const transparentStyle = {
        backgroundColor: 'transparent' as const,
      };
      const marginBottom = isLastRow ? 0 : CELL_GAP;
      return (
        <View
          key={`cell-${index}`}
          style={[
            styles.cell,
            {
              width: effectiveCellSize,
              height: effectiveCellSize,
              marginBottom,
              ...transparentStyle,
            },
          ]}
        />
      );
    }

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
    const cellStyle = [
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
    ];

    if (!interactive) {
      return (
        <View
          key={`cell-${index}-${dateKey}`}
          testID={`activity-cell-${index}`}
          style={cellStyle}
        />
      );
    }

    return (
      <TouchableOpacity
        key={`cell-${index}-${dateKey}`}
        testID={`activity-cell-${index}`}
        style={cellStyle}
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
        {weekRowsData.map((rowData, rowIndex) => {
          const row = rowData.weeks;
          // Calculate absolute week index accounting for reversed row order
          // When reversed, rowIndex 0 is the newest weeks (first row with max columns)
          let absoluteWeekIndex: number;
          if (enableMultiRowLayout) {
            // Calculate absolute index by summing up weeks in previous rows
            let weekCount = 0;
            for (let i = weekRowsData.length - 1; i > rowIndex; i--) {
              weekCount += weekRowsData[i].weeks.length;
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
            <React.Fragment key={`row-fragment-${rowIndex}`}>
              {rowData.year !== undefined && (
                <View style={styles.yearLabelContainer}>
                  <Text
                    style={[
                      styles.yearLabel,
                      { color: theme.colors.activityLabel },
                    ]}>
                    {rowData.year}
                  </Text>
                </View>
              )}
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
                    // Right-align last row of each year when splitting by year
                    // OR right-align last row of entire wall when not splitting by year
                    (splitByYear &&
                      rowData.isLastRowOfYear &&
                      row.length < maxWeekColumns) ||
                    (!splitByYear &&
                      enableMultiRowLayout &&
                      rowIndex === weekRowsData.length - 1 &&
                      row.length < maxWeekColumns)
                      ? {
                          paddingLeft:
                            (maxWeekColumns - row.length) *
                            (effectiveCellSize + CELL_GAP),
                        }
                      : undefined,
                  ]}>
                  {row.map(week => {
                    const currentAbsoluteWeekIndex = absoluteWeekIndex++;
                    return (
                      <View
                        key={`week-${currentAbsoluteWeekIndex}`}
                        style={styles.weekColumn}
                        testID={`week-${currentAbsoluteWeekIndex}`}>
                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                          const date = week[dayIndex] || null;
                          return renderCell(
                            date,
                            currentAbsoluteWeekIndex * 7 + dayIndex,
                            dayIndex === 6
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </View>
            </React.Fragment>
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
              : showDescription
                ? t('metric_detail.select_cell_hint')
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
  yearLabelContainer: {
    paddingVertical: 8,
    paddingLeft: 16,
    alignItems: 'flex-start',
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
