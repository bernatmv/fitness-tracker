import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@utils';
import { MetricCard, LoadingSpinner, ErrorMessage } from '@components/common';
import { LoadHealthData, LoadUserPreferences } from '@services/storage';
import { SyncFromLastDataDate } from '@services/sync';
import {
  MetricType,
  HealthDataStore,
  UserPreferences,
  LoadingState,
} from '@types';
import { FormatRelativeTime } from '@utils';

interface HomeScreenProps {
  onMetricPress: (metricType: MetricType) => void;
}

/**
 * HomeScreen Component
 * Main screen displaying all metric cards
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ onMetricPress }) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [loadingState, setLoadingState] = useState<LoadingState>(
    LoadingState.LOADING
  );
  const [healthData, setHealthData] = useState<HealthDataStore | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string>('');

  const LoadData = useCallback(async () => {
    try {
      setLoadingState(LoadingState.LOADING);
      const [data, prefs] = await Promise.all([
        LoadHealthData(),
        LoadUserPreferences(),
      ]);

      setHealthData(data);
      setPreferences(prefs);

      if (data?.lastFullSync) {
        setLastSyncText(FormatRelativeTime(data.lastFullSync));
      }

      setLoadingState(LoadingState.SUCCESS);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadingState(LoadingState.ERROR);
    }
  }, []);

  const HandleSync = async () => {
    try {
      setRefreshing(true);
      const data = await SyncFromLastDataDate(30); // Sync from last day with data (inclusive), capped at 30 days
      setHealthData(data);
      setLastSyncText(FormatRelativeTime(data.lastFullSync));
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    LoadData();
  }, [LoadData]);

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

  if (loadingState === LoadingState.LOADING) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (loadingState === LoadingState.ERROR) {
    return (
      <ErrorMessage message={t('errors.load_failed')} onRetry={LoadData} />
    );
  }

  const enabledMetrics =
    preferences?.metricConfigs &&
    Object.values(preferences.metricConfigs).filter(config => config.enabled);

  const isDarkMode = theme.mode === 'dark';
  const backgroundColor = theme.colors.background;
  const titleColor = isDarkMode ? '#FFFFFF' : theme.colors.text.primary;
  const secondaryTextColor = isDarkMode
    ? '#8E8E93'
    : theme.colors.text.secondary;
  // Card background should match home background
  const cardBackground = backgroundColor;
  const cardTextColor = isDarkMode ? '#FFFFFF' : undefined;
  const cardSecondaryTextColor = isDarkMode ? '#8E8E93' : undefined;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text h3 style={{ color: titleColor }}>
          {t('home.title')}
        </Text>
        <Text style={[styles.lastSync, { color: secondaryTextColor }]}>
          {lastSyncText && t('home.last_sync', { time: lastSyncText })}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 50 + insets.bottom + 16 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={HandleSync}
            tintColor={isDarkMode ? '#FFFFFF' : undefined}
            colors={isDarkMode ? undefined : [theme.colors.primary]}
          />
        }>
        {enabledMetrics && enabledMetrics.length > 0 ? (
          enabledMetrics.map(config => {
            const metricData = healthData?.metrics[config.metricType];
            const dataPoints = metricData?.dataPoints || [];

            return (
              <MetricCard
                key={config.metricType}
                config={config}
                dataPoints={dataPoints}
                onPress={() => onMetricPress(config.metricType)}
                showMiniWall={true}
                cardBackgroundColor={cardBackground}
                textColor={cardTextColor}
                secondaryTextColor={cardSecondaryTextColor}
                enableMultiRowLayout={
                  preferences?.enableMultiRowLayout ?? false
                }
              />
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {t('home.no_data')}
            </Text>
            <Button
              title={t('home.sync_now')}
              onPress={HandleSync}
              containerStyle={styles.syncButton}
            />
          </View>
        )}
      </ScrollView>
    </View>
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
  lastSync: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  syncButton: {
    width: 200,
  },
});
