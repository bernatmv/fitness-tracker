import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { MetricCard, LoadingSpinner, ErrorMessage } from '@components/common';
import { LoadHealthData, LoadUserPreferences } from '@services/storage';
import { SyncAllMetrics } from '@services/sync';
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
      const data = await SyncAllMetrics();
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

  if (loadingState === LoadingState.LOADING) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (loadingState === LoadingState.ERROR) {
    return (
      <ErrorMessage
        message={t('errors.load_failed')}
        onRetry={LoadData}
      />
    );
  }

  const enabledMetrics =
    preferences?.metricConfigs &&
    Object.values(preferences.metricConfigs).filter(config => config.enabled);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text h3>{t('home.title')}</Text>
        <Text style={styles.lastSync}>
          {lastSyncText && t('home.last_sync', { time: lastSyncText })}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={HandleSync} />
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
              />
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('home.no_data')}</Text>
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
    padding: 16,
    paddingTop: 8,
  },
  lastSync: {
    fontSize: 14,
    opacity: 0.6,
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
    opacity: 0.6,
  },
  syncButton: {
    width: 200,
  },
});

