import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { ActivityWall } from '@components/activity_wall';
import { LoadingSpinner } from '@components/common';
import { useAppTheme } from '@utils';
import {
  LoadUserPreferences,
  SaveUserPreferences,
  LoadMetricData,
} from '@services/storage';
import { MetricType, MetricConfig, HealthMetricData } from '@types';
import { DEFAULT_METRIC_CONFIGS } from '@constants';

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

      if (prefs && prefs.metricConfigs[metricType]) {
        setConfig(prefs.metricConfigs[metricType]);
      } else {
        // Use default config if user config doesn't exist
        setConfig(DEFAULT_METRIC_CONFIGS[metricType]);
      }
      setMetricData(data);
    } catch (error) {
      console.error('Error loading configuration:', error);
      // Fallback to default config on error
      setConfig(DEFAULT_METRIC_CONFIGS[metricType]);
    } finally {
      setIsLoading(false);
    }
  };

  const HandleThresholdChange = (index: number, value: string) => {
    if (!config) return;

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
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!config) {
    return null;
  }

  const backgroundColor = isDarkMode ? '#000000' : theme.colors.background;
  const textColor = isDarkMode ? '#FFFFFF' : theme.colors.text.primary;
  const secondaryTextColor = isDarkMode
    ? '#8E8E93'
    : theme.colors.text.secondary;
  const borderColor = isDarkMode ? '#38383A' : '#E5E5EA';
  const inputBorderColor = isDarkMode ? '#48484A' : '#C6C6C8';
  const inputBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const inputTextColor = isDarkMode ? '#FFFFFF' : '#000000';

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.section, { borderBottomColor: borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t('configuration.preview')}
        </Text>
        {metricData && metricData.dataPoints.length > 0 && (
          <View style={styles.previewContainer}>
            <ActivityWall
              dataPoints={metricData.dataPoints}
              thresholds={config.colorRange.thresholds}
              colors={config.colorRange.colors}
              numDays={30}
            />
          </View>
        )}
      </View>

      <View style={[styles.section, { borderBottomColor: borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t('configuration.threshold_settings')}
        </Text>
        {config.colorRange.thresholds.map((threshold, index) => {
          if (
            threshold === Infinity ||
            threshold === null ||
            threshold === undefined
          ) {
            return null;
          }

          return (
            <View key={index} style={styles.thresholdRow}>
              <Text style={[styles.thresholdLabel, { color: textColor }]}>
                {t('configuration.range', { number: index + 1 })}
              </Text>
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
            </View>
          );
        })}
      </View>

      <View style={[styles.section, { borderBottomColor: borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t('configuration.color_settings')}
        </Text>
        <View style={styles.colorGrid}>
          {config.colorRange.colors.map((color, index) => (
            <View key={index} style={styles.colorItem}>
              <View
                style={[
                  styles.colorPreview,
                  {
                    backgroundColor: color,
                    borderColor: inputBorderColor,
                  },
                ]}
              />
              <Text style={[styles.colorText, { color: secondaryTextColor }]}>
                {color}
              </Text>
            </View>
          ))}
        </View>
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
          containerStyle={styles.actionButton}
        />
      </View>
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
  thresholdInput: {
    width: 100,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'right',
    fontSize: 16,
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
