import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { ListItem, Switch, Text, Button } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import {
  LoadUserPreferences,
  SaveUserPreferences,
  ClearUserPreferences,
} from '@services/storage';
import { UserPreferences, MetricType, ThemePreference } from '@types';
import { APP_VERSION } from '@constants';
import { LoadingSpinner } from '@components/common';
import { useAppTheme } from '@utils';

interface SettingsScreenProps {
  onThemePreferenceChange?: (preference: ThemePreference) => void;
}

/**
 * SettingsScreen Component
 * App settings and configuration
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onThemePreferenceChange,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
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

  const HandleThemePreferenceChange = async (
    newPreference: ThemePreference
  ) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      theme: newPreference,
    };

    setPreferences(updatedPreferences);
    await SaveUserPreferences(updatedPreferences);

    if (onThemePreferenceChange) {
      onThemePreferenceChange(newPreference);
    }
  };

  const HandleToggleMultiRowLayout = async () => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      enableMultiRowLayout: !preferences.enableMultiRowLayout,
    };

    setPreferences(updatedPreferences);
    await SaveUserPreferences(updatedPreferences);
  };

  const HandleClearPreferences = async () => {
    Alert.alert(
      'Clear Preferences',
      'This will clear all user preferences and reset to defaults. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await ClearUserPreferences();
              await LoadPreferences();
              Alert.alert('Success', 'Preferences cleared successfully');
            } catch (error) {
              console.error('Error clearing preferences:', error);
              Alert.alert('Error', 'Failed to clear preferences');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text
          h3
          style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('settings.title')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.metrics')}
        </Text>
        {preferences &&
          Object.values(preferences.metricConfigs).map(config => (
            <ListItem key={config.metricType} bottomDivider>
              <ListItem.Content>
                <ListItem.Title style={{ color: theme.colors.text.primary }}>
                  {config.displayName}
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                value={config.enabled}
                onValueChange={() => HandleToggleMetric(config.metricType)}
              />
            </ListItem>
          ))}
      </View>

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.appearance')}
        </Text>
        <ListItem
          onPress={() => HandleThemePreferenceChange('system')}
          bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.theme_system')}
            </ListItem.Title>
          </ListItem.Content>
          <ListItem.CheckBox checked={preferences?.theme === 'system'} />
        </ListItem>
        <ListItem
          onPress={() => HandleThemePreferenceChange('light')}
          bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.theme_light')}
            </ListItem.Title>
          </ListItem.Content>
          <ListItem.CheckBox checked={preferences?.theme === 'light'} />
        </ListItem>
        <ListItem
          onPress={() => HandleThemePreferenceChange('dark')}
          bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.theme_dark')}
            </ListItem.Title>
          </ListItem.Content>
          <ListItem.CheckBox checked={preferences?.theme === 'dark'} />
        </ListItem>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.multi_row_layout')}
            </ListItem.Title>
            <ListItem.Subtitle style={{ color: theme.colors.text.secondary }}>
              {t('settings.multi_row_layout_description')}
            </ListItem.Subtitle>
          </ListItem.Content>
          <Switch
            value={preferences?.enableMultiRowLayout ?? false}
            onValueChange={HandleToggleMultiRowLayout}
          />
        </ListItem>
      </View>

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.language')}
        </Text>
        <ListItem onPress={() => HandleChangeLanguage('en')} bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              English
            </ListItem.Title>
          </ListItem.Content>
          <ListItem.CheckBox checked={preferences?.language === 'en'} />
        </ListItem>
        <ListItem onPress={() => HandleChangeLanguage('es')} bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              Español
            </ListItem.Title>
          </ListItem.Content>
          <ListItem.CheckBox checked={preferences?.language === 'es'} />
        </ListItem>
      </View>

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.sync')}
        </Text>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.sync_strategy')}
            </ListItem.Title>
            <ListItem.Subtitle style={{ color: theme.colors.text.secondary }}>
              {preferences?.syncConfig.strategy}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
        {preferences?.syncConfig.periodicIntervalMinutes && (
          <ListItem bottomDivider>
            <ListItem.Content>
              <ListItem.Title style={{ color: theme.colors.text.primary }}>
                {t('settings.sync_interval')}
              </ListItem.Title>
              <ListItem.Subtitle style={{ color: theme.colors.text.secondary }}>
                {t('settings.periodic_sync', {
                  interval: preferences.syncConfig.periodicIntervalMinutes / 60,
                })}
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        )}
      </View>

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.about')}
        </Text>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.version', { version: APP_VERSION })}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
      </View>

      {__DEV__ && (
        <View style={styles.devSection}>
          <Button
            title="Clear User Preferences (Dev Only)"
            onPress={HandleClearPreferences}
            buttonStyle={styles.clearButton}
            titleStyle={styles.clearButtonTitle}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerTitle: {
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
  },
  devSection: {
    padding: 16,
    marginBottom: 24,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  clearButtonTitle: {
    color: '#FFFFFF',
  },
});
