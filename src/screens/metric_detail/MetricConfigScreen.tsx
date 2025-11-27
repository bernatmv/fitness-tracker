import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Button, Text, Slider } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { ActivityWall } from '@components/activity_wall';
import { LoadingSpinner } from '@components/common';
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
  const [config, setConfig] = useState<MetricConfig | null>(null);
  const [metricData, setMetricData] = useState<HealthMetricData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    LoadData();
  }, [metricType]);

  const LoadData = async () => {
    try {
      setIsLoading(true);
      const [prefs, data] = await Promise.all([
        LoadUserPreferences(),
        LoadMetricData(metricType),
      ]);

      if (prefs) {
        setConfig(prefs.metricConfigs[metricType]);
      }
      setMetricData(data);
    } catch (error) {
      console.error('Error loading configuration:', error);
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

  const HandleColorChange = (index: number, color: string) => {
    if (!config) return;

    const newColors = [...config.colorRange.colors];
    newColors[index] = color;

    setConfig({
      ...config,
      colorRange: {
        ...config.colorRange,
        colors: newColors,
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('configuration.preview')}</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('configuration.threshold_settings')}
        </Text>
        {config.colorRange.thresholds.map((threshold, index) => {
          if (threshold === Infinity) return null;

          return (
            <View key={index} style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>
                {t('configuration.range', { number: index + 1 })}
              </Text>
              <TextInput
                style={styles.thresholdInput}
                value={threshold.toString()}
                onChangeText={value => HandleThresholdChange(index, value)}
                keyboardType="numeric"
              />
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('configuration.color_settings')}
        </Text>
        <View style={styles.colorGrid}>
          {config.colorRange.colors.map((color, index) => (
            <View key={index} style={styles.colorItem}>
              <View style={[styles.colorPreview, { backgroundColor: color }]} />
              <Text style={styles.colorText}>{color}</Text>
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
    borderBottomColor: '#E5E5EA',
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
    borderColor: '#C6C6C8',
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
    borderColor: '#C6C6C8',
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
