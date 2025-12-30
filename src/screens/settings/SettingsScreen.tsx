import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { ListItem, Switch, Text, Button, Icon } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LoadUserPreferences,
  SaveUserPreferences,
  ClearUserPreferences,
  ClearAllHealthData,
} from '@services/storage';
import { SyncAllDataFromAllTime } from '@services/sync';
import { UserPreferences, MetricType, ThemePreference } from '@types';
import { APP_VERSION } from '@constants';
import { LoadingSpinner } from '@components/common';
import { useAppTheme } from '@utils';
import { GetWidgetDiagnostics, widgetUpdater } from '@services/widget';

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
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

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

  const HandleSyncAllData = async () => {
    Alert.alert(
      t('settings.sync_all_data_title') || 'Sync All Health Data',
      t('settings.sync_all_data_message') ||
        'This will import all available health data from all time. Existing data for each day will be overwritten. This may take a while.',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('settings.sync_all_data') || 'Sync All',
          onPress: async () => {
            try {
              setIsSyncingAll(true);
              await SyncAllDataFromAllTime();
              Alert.alert(
                t('common.success') || 'Success',
                t('settings.sync_all_data_success') ||
                  'All health data has been synced successfully'
              );
            } catch (error) {
              console.error('Error syncing all data:', error);
              Alert.alert(
                t('common.error') || 'Error',
                t('settings.sync_all_data_error') ||
                  'Failed to sync health data. Please check your permissions.'
              );
            } finally {
              setIsSyncingAll(false);
            }
          },
        },
      ]
    );
  };

  const HandleClearAllData = async () => {
    Alert.alert(
      t('settings.clear_all_data_title') || 'Clear All Health Data',
      t('settings.clear_all_data_message') ||
        'This will permanently delete all imported health data from the app. This action cannot be undone.',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('settings.clear_all_data') || 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearingData(true);
              await ClearAllHealthData();
              Alert.alert(
                t('common.success') || 'Success',
                t('settings.clear_all_data_success') ||
                  'All health data has been cleared successfully'
              );
            } catch (error) {
              console.error('Error clearing all data:', error);
              Alert.alert(
                t('common.error') || 'Error',
                t('settings.clear_all_data_error') ||
                  'Failed to clear health data'
              );
            } finally {
              setIsClearingData(false);
            }
          },
        },
      ]
    );
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

  const HandleWidgetDiagnostics = async () => {
    try {
      const diagnostics = await GetWidgetDiagnostics();
      const title = t('settings.widgets_diagnostics_title') || 'Widget Diagnostics';
      const messageLines = [
        `${t('settings.widgets_app_group_available') || 'App Group available'}: ${
          diagnostics.appGroupAvailable ? '✅' : '❌'
        }`,
        `${t('settings.widgets_updater_available') || 'Widget updater available'}: ${
          diagnostics.widgetUpdaterAvailable ? '✅' : '❌'
        }`,
        `${t('settings.widgets_has_health_data') || 'Has health data'}: ${
          diagnostics.hasHealthData ? '✅' : '❌'
        }`,
        `${t('settings.widgets_has_preferences') || 'Has preferences'}: ${
          diagnostics.hasUserPreferences ? '✅' : '❌'
        }`,
        '',
        `${t('settings.widgets_app_group_keys') || 'App Group keys'} (${
          diagnostics.appGroupKeys.length
        }):`,
        diagnostics.appGroupKeys.length > 0
          ? diagnostics.appGroupKeys.join('\n')
          : t('settings.widgets_none') || 'None',
      ];

      Alert.alert(title, messageLines.join('\n'));
    } catch (error) {
      console.error('Error getting widget diagnostics:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('settings.widgets_diagnostics_error') ||
          'Failed to load widget diagnostics'
      );
    }
  };

  const HandleWidgetRefresh = async () => {
    try {
      await widgetUpdater.ReloadAllTimelines();
      Alert.alert(
        t('common.success') || 'Success',
        t('settings.widgets_refresh_success') || 'Requested widget refresh'
      );
    } catch (error) {
      console.error('Error refreshing widgets:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('settings.widgets_refresh_error') || 'Failed to refresh widgets'
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 50 + insets.bottom + 16 }}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text
          h3
          style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('settings.title')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.data') || 'Data'}
        </Text>
        <ListItem
          onPress={HandleSyncAllData}
          bottomDivider
          disabled={isSyncingAll}>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.sync_all_data') || 'Sync All Health Data'}
            </ListItem.Title>
            <ListItem.Subtitle style={{ color: theme.colors.text.secondary }}>
              {t('settings.sync_all_data_description') ||
                'Import all available health data from all time'}
            </ListItem.Subtitle>
          </ListItem.Content>
          {isSyncingAll ? (
            <View style={{ marginRight: 8 }}>
              <LoadingSpinner />
            </View>
          ) : (
            <Icon
              name="refresh"
              type="material"
              color={theme.colors.link}
              size={24}
            />
          )}
        </ListItem>
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
          <ListItem.CheckBox
            checked={preferences?.theme === 'system'}
            onPress={() => HandleThemePreferenceChange('system')}
          />
        </ListItem>
        <ListItem
          onPress={() => HandleThemePreferenceChange('light')}
          bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.theme_light')}
            </ListItem.Title>
          </ListItem.Content>
          <ListItem.CheckBox
            checked={preferences?.theme === 'light'}
            onPress={() => HandleThemePreferenceChange('light')}
          />
        </ListItem>
        <ListItem
          onPress={() => HandleThemePreferenceChange('dark')}
          bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.theme_dark')}
            </ListItem.Title>
          </ListItem.Content>
          <ListItem.CheckBox
            checked={preferences?.theme === 'dark'}
            onPress={() => HandleThemePreferenceChange('dark')}
          />
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

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.widgets') || 'Widgets'}
        </Text>
        <ListItem onPress={HandleWidgetDiagnostics} bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.widgets_diagnostics') || 'Widget Diagnostics'}
            </ListItem.Title>
            <ListItem.Subtitle style={{ color: theme.colors.text.secondary }}>
              {t('settings.widgets_diagnostics_description') ||
                'Check shared storage access and widget data keys'}
            </ListItem.Subtitle>
          </ListItem.Content>
          <Icon
            name="info-outline"
            type="material"
            color={theme.colors.link}
            size={24}
          />
        </ListItem>
        <ListItem onPress={HandleWidgetRefresh} bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={{ color: theme.colors.text.primary }}>
              {t('settings.widgets_refresh') || 'Refresh Widgets'}
            </ListItem.Title>
            <ListItem.Subtitle style={{ color: theme.colors.text.secondary }}>
              {t('settings.widgets_refresh_description') ||
                'Request WidgetKit to reload timelines'}
            </ListItem.Subtitle>
          </ListItem.Content>
          <Icon
            name="refresh"
            type="material"
            color={theme.colors.link}
            size={24}
          />
        </ListItem>
      </View>

      <View style={styles.devSection}>
        <Button
          title={t('settings.clear_all_data') || 'Clear All Health Data'}
          onPress={HandleClearAllData}
          loading={isClearingData}
          disabled={isClearingData}
          buttonStyle={[
            styles.clearButton,
            { backgroundColor: theme.colors.error },
          ]}
          titleStyle={styles.clearButtonTitle}
        />
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
    paddingBottom: 16,
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
