import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, LayoutChangeEvent } from 'react-native';
import { Button, Text, ButtonGroup } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '@utils';
import { ActivityWall } from '@components/activity_wall';
import { LoadingSpinner } from '@components/common';
import { LoadMetricData, LoadUserPreferences } from '@services/storage';
import {
  MetricType,
  HealthMetricData,
  MetricConfig,
  UserPreferences,
} from '@types';
import { GetDateRange, FormatCompactNumber, GetStartOfDay } from '@utils';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(1); // Default to 30 days
  const [numDays, setNumDays] = useState<number | null>(30);
  const [containerWidth, setContainerWidth] = useState(0);

  // Use -1 as special value for "Fit"
  const dateRangeOptions: (number | null)[] = [-1, 30, 90, 365, null];
  const dateRangeLabels = ['Fit', '30D', '90D', '12M', 'All'];

  useEffect(() => {
    LoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricType]);

  // Reload preferences when screen comes into focus (e.g., returning from Settings)
  useFocusEffect(
    useCallback(() => {
      const ReloadPreferences = async () => {
        try {
          const prefs = await LoadUserPreferences();
          if (prefs) {
            setPreferences(prefs);
          }
        } catch (error) {
          console.error('Error reloading preferences:', error);
        }
      };
      ReloadPreferences();
    }, [])
  );

  const LoadData = async () => {
    try {
      setIsLoading(true);
      const [data, prefs] = await Promise.all([
        LoadMetricData(metricType),
        LoadUserPreferences(),
      ]);

      setMetricData(data);
      setConfig(prefs?.metricConfigs[metricType] || null);
      setPreferences(prefs);
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
    if (numDays !== null && numDays !== -1) {
      // -1 is "Fit", use all data for statistics
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

  const isDarkMode = theme.mode === 'dark';
  const backgroundColor = isDarkMode ? '#000000' : theme.colors.background;
  const titleColor = isDarkMode ? '#FFFFFF' : theme.colors.text.primary;
  const secondaryTextColor = isDarkMode
    ? '#8E8E93'
    : theme.colors.text.secondary;
  const statCardBackground = isDarkMode
    ? '#1C1C1E'
    : theme.colors.statCardBackground;

  const buttonGroupStyles = useMemo(
    () => ({
      container: {
        backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7',
        borderRadius: 8,
        borderWidth: 0,
      },
      selectedButton: {
        backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA',
      },
      buttonText: {
        color: isDarkMode ? '#8E8E93' : '#3C3C43',
      },
      selectedButtonText: {
        color: isDarkMode ? '#FFFFFF' : '#000000',
      },
    }),
    [isDarkMode]
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = CalculateStatistics();
  const dataPoints = metricData?.dataPoints || [];

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text h3 style={{ color: titleColor }}>
          {config?.displayName || metricType}
        </Text>
        <Button
          title={t('metric_detail.configure')}
          onPress={onConfigurePress}
          type="outline"
          containerStyle={styles.configButton}
        />
      </View>

      <View style={styles.rangeSelector}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>
          {t('metric_detail.view_range')}
        </Text>
        <ButtonGroup
          buttons={dateRangeLabels}
          selectedIndex={selectedIndex}
          onPress={HandleDateRangeChange}
          containerStyle={[styles.buttonGroup, buttonGroupStyles.container]}
          selectedButtonStyle={[
            styles.selectedButton,
            buttonGroupStyles.selectedButton,
          ]}
          buttonStyle={styles.button}
          textStyle={[styles.buttonText, buttonGroupStyles.buttonText]}
          selectedTextStyle={[
            styles.selectedButtonText,
            buttonGroupStyles.selectedButtonText,
          ]}
          innerBorderStyle={styles.innerBorder}
        />
      </View>

      {config && dataPoints.length > 0 && (
        <View style={styles.activityWallContainer}>
          <View
            style={styles.activityWallWrapper}
            onLayout={(event: LayoutChangeEvent) => {
              const width = event.nativeEvent.layout.width;
              if (Math.abs(width - containerWidth) > 1) {
                setContainerWidth(width);
              }
            }}>
            {(() => {
              // Calculate effective numDays
              let effectiveNumDays: number;

              if (numDays === null) {
                // "All" - calculate from first available record
                const sortedPoints = [...dataPoints].sort(
                  (a, b) => a.date.getTime() - b.date.getTime()
                );
                const firstDate = sortedPoints[0]?.date;
                const today = GetStartOfDay(new Date());

                if (firstDate) {
                  const daysDiff = Math.ceil(
                    (today.getTime() - GetStartOfDay(firstDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  // Minimum of 12 months (365 days)
                  effectiveNumDays = Math.max(daysDiff, 365);
                } else {
                  effectiveNumDays = 365;
                }
              } else if (numDays === -1) {
                // "Fit" - calculate weeks to fit exactly one row
                // Account for: container width (which ActivityWall will measure), padding, day labels, gaps
                const CELL_SIZE = 12;
                const CELL_GAP = 5;
                const labelColumnWidth = 32; // Day labels column width
                const showDayLabels = true;
                const padding = 32; // 16px left + 16px right from activityWallWrapper

                if (containerWidth > 0) {
                  // containerWidth is the wrapper width (includes padding)
                  // ActivityWall's container will be this width, but content is constrained by padding
                  // So available width for grid = containerWidth - padding
                  const availableWidth = containerWidth - padding;
                  const effectiveLabelColumnWidth = showDayLabels
                    ? labelColumnWidth
                    : 0;
                  const gridWidth =
                    availableWidth -
                    effectiveLabelColumnWidth -
                    (showDayLabels ? CELL_GAP : 0);
                  const columnWidth = CELL_SIZE + CELL_GAP;
                  if (columnWidth > 0) {
                    const maxWeeks = Math.floor(
                      (gridWidth + CELL_GAP) / columnWidth
                    );
                    // Convert weeks to days (weeks * 7 days)
                    effectiveNumDays = Math.max(7, maxWeeks * 7);
                  } else {
                    effectiveNumDays = 7;
                  }
                } else {
                  // Default to 7 days if container width not available yet
                  effectiveNumDays = 7;
                }
              } else {
                effectiveNumDays = numDays;
              }

              // Enable multi-row layout except for "Fit" which should be single row
              // Split by year when "All" is selected
              const shouldEnableMultiRow = numDays !== -1;
              const shouldSplitByYear = numDays === null;
              return (
                <ActivityWall
                  key={`activity-wall-${effectiveNumDays}`}
                  dataPoints={dataPoints}
                  thresholds={config.colorRange.thresholds}
                  colors={config.colorRange.colors}
                  numDays={effectiveNumDays}
                  showMonthLabels={true}
                  showDayLabels={true}
                  showDescription={true}
                  enableMultiRowLayout={shouldEnableMultiRow}
                  splitByYear={shouldSplitByYear}
                />
              );
            })()}
          </View>
        </View>
      )}

      <View style={styles.statsContainer}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>
          {t('metric_detail.statistics')}
        </Text>

        <View style={styles.statsGrid}>
          <View
            style={[styles.statCard, { backgroundColor: statCardBackground }]}>
            <Text
              style={[styles.statValue, { color: titleColor }]}
              numberOfLines={1}>
              {FormatCompactNumber(stats.average)}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>
              {t('metric_detail.average')}
            </Text>
          </View>

          <View
            style={[styles.statCard, { backgroundColor: statCardBackground }]}>
            <Text
              style={[styles.statValue, { color: titleColor }]}
              numberOfLines={1}>
              {FormatCompactNumber(stats.total)}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>
              {t('metric_detail.total')}
            </Text>
          </View>

          <View
            style={[styles.statCard, { backgroundColor: statCardBackground }]}>
            <Text
              style={[styles.statValue, { color: titleColor }]}
              numberOfLines={1}>
              {FormatCompactNumber(stats.bestDay)}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>
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
  selectedButton: {
    borderRadius: 6,
  },
  button: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 32,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  innerBorder: {
    width: 0,
  },
  activityWallContainer: {
    marginTop: 8,
    width: '100%',
  },
  activityWallWrapper: {
    width: '100%',
    overflow: 'hidden',
    paddingLeft: 16,
    paddingRight: 16,
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
