import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  LayoutChangeEvent,
  TouchableOpacity,
} from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { ActivityWall } from '@components/activity_wall';
import { LoadingSpinner, ColorPicker } from '@components/common';
import { useAppTheme } from '@utils';
import {
  LoadUserPreferences,
  SaveUserPreferences,
  LoadMetricData,
} from '@services/storage';
import { MetricType, MetricConfig, HealthMetricData } from '@types';
import { DEFAULT_METRIC_CONFIGS } from '@constants';
import { GetColorsForMetricConfig } from '@services/theme';

interface MetricConfigScreenProps {
  metricType: MetricType;
  onSave: () => void;
}

/**
 * MetricConfigScreen Component
 * Configure colors and thresholds for a metric
 */
export const MetricConfigScreen: React.FC<MetricConfigScreenProps> = ({
  metricType,
  onSave,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const isDarkMode = theme.mode === 'dark';
  const [config, setConfig] = useState<MetricConfig | null>(null);
  const [metricData, setMetricData] = useState<HealthMetricData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(
    null
  );
  const [originalConfig, setOriginalConfig] = useState<MetricConfig | null>(
    null
  );
  const numDays = -1; // Use "Fit" mode

  useEffect(() => {
    LoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricType]);

  const LoadData = async () => {
    try {
      setIsLoading(true);
      const [prefs, data] = await Promise.all([
        LoadUserPreferences(),
        LoadMetricData(metricType),
      ]);

      let loadedConfig: MetricConfig;
      if (prefs && prefs.metricConfigs[metricType]) {
        loadedConfig = prefs.metricConfigs[metricType];
      } else {
        // Use default config if user config doesn't exist
        loadedConfig = DEFAULT_METRIC_CONFIGS[metricType];
      }

      setConfig(loadedConfig);
      // Store a deep copy as the original for comparison
      setOriginalConfig(JSON.parse(JSON.stringify(loadedConfig)));
      setMetricData(data);
    } catch (error) {
      console.error('Error loading configuration:', error);
      // Fallback to default config on error
      const fallbackConfig = DEFAULT_METRIC_CONFIGS[metricType];
      setConfig(fallbackConfig);
      setOriginalConfig(JSON.parse(JSON.stringify(fallbackConfig)));
    } finally {
      setIsLoading(false);
    }
  };

  const HandleThresholdChange = (index: number, value: string) => {
    if (!config) return;

    // Prevent editing the first threshold (index 0, value 0)
    if (index === 0) {
      return;
    }

    const numValue = parseFloat(value) || 0;
    const newThresholds = [...config.colorRange.thresholds];
    newThresholds[index] = numValue;

    setConfig({
      ...config,
      colorRange: {
        ...config.colorRange,
        thresholds: newThresholds,
      },
    });
  };

  const HandleSave = async () => {
    if (!config) return;

    try {
      setIsSaving(true);
      const prefs = await LoadUserPreferences();

      if (prefs) {
        const updatedPrefs = {
          ...prefs,
          metricConfigs: {
            ...prefs.metricConfigs,
            [metricType]: config,
          },
        };

        await SaveUserPreferences(updatedPrefs);
        // Update original config after successful save
        setOriginalConfig(JSON.parse(JSON.stringify(config)));
        onSave();
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const HandleResetDefaults = () => {
    const defaultConfig = DEFAULT_METRIC_CONFIGS[metricType];
    setConfig(defaultConfig);
    // Don't update originalConfig here - keep it so save button is enabled
    // to allow saving the reset to defaults
  };

  const HandleColorIndicatorPress = (index: number) => {
    setSelectedColorIndex(index);
    setColorPickerVisible(true);
  };

  const HandleColorChange = (color: string) => {
    // Color editing is disabled when using palette-based system
    // Users should select a different palette instead
    // This functionality can be re-enabled later with palette selection UI
    console.warn('Color editing is not supported with palette-based configuration. Please select a different palette.');
  };

  const HandleColorPickerClose = () => {
    setColorPickerVisible(false);
    setSelectedColorIndex(null);
  };

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setContainerWidth(prevWidth => {
      // Only update if the change is significant (more than 1px)
      if (Math.abs(width - prevWidth) > 1) {
        return width;
      }
      return prevWidth;
    });
  }, []);

  // Calculate effective numDays for "Fit" mode - memoized to prevent re-render loops
  const effectiveNumDays = useMemo(() => {
    if (numDays === -1) {
      // "Fit" - calculate weeks to fit exactly one row
      const CELL_SIZE = 12;
      const CELL_GAP = 5;
      const labelColumnWidth = 32; // Day labels column width
      const showDayLabels = true;
      const padding = 32; // 16px left + 16px right from previewContainer

      if (containerWidth > 0) {
        const availableWidth = containerWidth - padding;
        const effectiveLabelColumnWidth = showDayLabels ? labelColumnWidth : 0;
        const gridWidth =
          availableWidth -
          effectiveLabelColumnWidth -
          (showDayLabels ? CELL_GAP : 0);
        const columnWidth = CELL_SIZE + CELL_GAP;
        if (columnWidth > 0) {
          const maxWeeks = Math.floor((gridWidth + CELL_GAP) / columnWidth);
          // Convert weeks to days (weeks * 7 days)
          return Math.max(7, maxWeeks * 7);
        }
      }
      // Default to 7 days if container width not available yet
      return 7;
    }
    return numDays;
  }, [containerWidth, numDays]);

  // Check if there are any changes to save
  const hasChanges = useMemo(() => {
    if (!config || !originalConfig) return false;

    // Compare thresholds
    if (
      config.colorRange.thresholds.length !==
      originalConfig.colorRange.thresholds.length
    ) {
      return true;
    }

    for (let i = 0; i < config.colorRange.thresholds.length; i++) {
      if (
        config.colorRange.thresholds[i] !==
        originalConfig.colorRange.thresholds[i]
      ) {
        return true;
      }
    }

    // Compare paletteId
    if (config.colorRange.paletteId !== originalConfig.colorRange.paletteId) {
      return true;
    }

    return false;
  }, [config, originalConfig]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!config) {
    return null;
  }

  const backgroundColor = theme.colors.background;
  const textColor = isDarkMode ? '#FFFFFF' : theme.colors.text.primary;
  const secondaryTextColor = isDarkMode
    ? '#8E8E93'
    : theme.colors.text.secondary;
  const borderColor = isDarkMode ? '#38383A' : '#E5E5EA';
  const inputBorderColor = isDarkMode ? '#48484A' : '#C6C6C8';
  const inputBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const inputTextColor = isDarkMode ? '#FFFFFF' : '#000000';
  const disabledInputBackgroundColor = isDarkMode ? '#2C2C2E' : '#F2F2F7';

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.section, { borderBottomColor: borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t('configuration.preview')}
        </Text>
        {metricData && metricData.dataPoints.length > 0 && (
          <View style={styles.previewContainer} onLayout={handleLayout}>
            <ActivityWall
              key={`activity-wall-${effectiveNumDays}`}
              dataPoints={metricData.dataPoints}
              thresholds={config.colorRange.thresholds}
              colors={GetColorsForMetricConfig(config.colorRange.paletteId, isDarkMode)}
              numDays={effectiveNumDays}
              enableMultiRowLayout={false}
              interactive={false}
              showDescription={false}
            />
          </View>
        )}
      </View>

      <View style={[styles.section, { borderBottomColor: borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t('configuration.threshold_settings')}
        </Text>
        {config.colorRange.thresholds.map((threshold, index) => {
          if (threshold === null || threshold === undefined) {
            return null;
          }

          // Skip the first threshold (index 0) - it's not editable
          if (index === 0) {
            return null;
          }

          const isFirstThreshold = index === 0;
          const isLastThreshold = threshold === Infinity;
          const isEditable = !isFirstThreshold && !isLastThreshold;

          // Get the corresponding color for this threshold rank from the palette
          const colors = GetColorsForMetricConfig(config.colorRange.paletteId, isDarkMode);
          let thresholdColor =
            index < colors.length
              ? colors[index]
              : colors[colors.length - 1];

          return (
            <View key={index} style={styles.thresholdRow}>
              <Text style={[styles.thresholdLabel, { color: textColor }]}>
                {t('configuration.range', { number: index })}
              </Text>
              <View style={styles.thresholdInputContainer}>
                {isEditable ? (
                  <TextInput
                    style={[
                      styles.thresholdInput,
                      {
                        borderColor: inputBorderColor,
                        backgroundColor: inputBackgroundColor,
                        color: inputTextColor,
                      },
                    ]}
                    value={threshold.toString()}
                    onChangeText={value => HandleThresholdChange(index, value)}
                    keyboardType="numeric"
                    placeholderTextColor={secondaryTextColor}
                  />
                ) : (
                  <TextInput
                    style={[
                      styles.thresholdInput,
                      {
                        borderColor: inputBorderColor,
                        backgroundColor: disabledInputBackgroundColor,
                        color: secondaryTextColor,
                      },
                    ]}
                    value={isLastThreshold ? 'Max' : threshold.toString()}
                    editable={false}
                    placeholderTextColor={secondaryTextColor}
                  />
                )}
                <TouchableOpacity
                  onPress={() => HandleColorIndicatorPress(index)}
                  style={[
                    styles.thresholdColorIndicator,
                    {
                      backgroundColor: thresholdColor,
                      borderColor: inputBorderColor,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button
          title={t('configuration.reset_defaults')}
          onPress={HandleResetDefaults}
          type="outline"
          containerStyle={styles.actionButton}
        />
        <Button
          title={t('common.save')}
          onPress={HandleSave}
          loading={isSaving}
          disabled={!hasChanges || isSaving}
          containerStyle={styles.actionButton}
        />
      </View>

      {config && selectedColorIndex !== null && (
        <ColorPicker
          visible={colorPickerVisible}
          currentColor={GetColorsForMetricConfig(config.colorRange.paletteId, isDarkMode)[selectedColorIndex]}
          thresholdIndex={selectedColorIndex}
          onColorChange={HandleColorChange}
          onClose={HandleColorPickerClose}
          theme={theme}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  thresholdLabel: {
    fontSize: 16,
  },
  thresholdInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thresholdInput: {
    width: 100,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'right',
    fontSize: 16,
  },
  thresholdColorIndicator: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorItem: {
    alignItems: 'center',
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
  },
  colorText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
});
