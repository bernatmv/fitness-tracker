import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ListItem, Switch, Text } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { LoadUserPreferences, SaveUserPreferences } from '@services/storage';
import { UserPreferences, MetricType } from '@types';
import { APP_VERSION } from '@constants';
import { LoadingSpinner } from '@components/common';

interface SettingsScreenProps {
  onMetricConfigPress: (metricType: MetricType) => void;
}

/**
 * SettingsScreen Component
 * App settings and configuration
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onMetricConfigPress,
}) => {
  const { t, i18n } = useTranslation();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    LoadPreferences();
  }, []);

  const LoadPreferences = async () => {
    try {
      const prefs = await LoadUserPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const HandleToggleMetric = async (metricType: MetricType) => {
    if (!preferences) return;

    const updatedConfigs = { ...preferences.metricConfigs };
    updatedConfigs[metricType] = {
      ...updatedConfigs[metricType],
      enabled: !updatedConfigs[metricType].enabled,
    };

    const updatedPreferences = {
      ...preferences,
      metricConfigs: updatedConfigs,
    };

    setPreferences(updatedPreferences);
    await SaveUserPreferences(updatedPreferences);
  };

  const HandleChangeLanguage = async (languageCode: string) => {
    if (!preferences) return;

    await i18n.changeLanguage(languageCode);
    
    const updatedPreferences = {
      ...preferences,
      language: languageCode,
    };

    setPreferences(updatedPreferences);
    await SaveUserPreferences(updatedPreferences);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.metrics')}</Text>
        {preferences &&
          Object.values(preferences.metricConfigs).map(config => (
            <ListItem key={config.metricType} bottomDivider>
              <ListItem.Content>
                <ListItem.Title>{config.displayName}</ListItem.Title>
              </ListItem.Content>
              <Switch
                value={config.enabled}
                onValueChange={() => HandleToggleMetric(config.metricType)}
              />
              <ListItem.Chevron
                onPress={() => onMetricConfigPress(config.metricType)}
              />
            </ListItem>
          ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>{t('settings.language')}</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
        <ListItem
          onPress={() => HandleChangeLanguage('en')}
          bottomDivider>
          <ListItem.Content>
            <ListItem.Title>English</ListItem.Title>
          </ListItem.Content>
          {preferences?.language === 'en' && (
            <ListItem.CheckBox checked={true} />
          )}
        </ListItem>
        <ListItem
          onPress={() => HandleChangeLanguage('es')}
          bottomDivider>
          <ListItem.Content>
            <ListItem.Title>Español</ListItem.Title>
          </ListItem.Content>
          {preferences?.language === 'es' && (
            <ListItem.CheckBox checked={true} />
          )}
        </ListItem>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sync')}</Text>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>{t('settings.sync_strategy')}</ListItem.Title>
            <ListItem.Subtitle>
              {preferences?.syncConfig.strategy}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
        {preferences?.syncConfig.periodicIntervalMinutes && (
          <ListItem bottomDivider>
            <ListItem.Content>
              <ListItem.Title>{t('settings.sync_interval')}</ListItem.Title>
              <ListItem.Subtitle>
                {t('settings.periodic_sync', {
                  interval: preferences.syncConfig.periodicIntervalMinutes / 60,
                })}
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>
              {t('settings.version', { version: APP_VERSION })}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 0.6,
  },
});

