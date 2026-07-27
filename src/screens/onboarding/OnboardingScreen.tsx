import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Button, Text, Icon } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@utils';
import { RequestHealthPermissions } from '@services/health_data';
import { SaveUserPreferences } from '@services/storage';
import { SyncAllDataFromAllTime } from '@services/sync';
import {
  DEFAULT_METRIC_CONFIGS,
  DEFAULT_SYNC_CONFIG,
  DEFAULT_THEME_PREFERENCE,
  SYNC_YEARS,
} from '@constants';
import { UserPreferences } from '@types';
import { AppButton, LoadingSpinner } from '@components/common';

interface OnboardingScreenProps {
  onComplete: () => void;
}

/**
 * OnboardingScreen Component
 * First-time setup and permissions flow
 */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const HandleRequestPermissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const granted = await RequestHealthPermissions();
      setPermissionsGranted(granted);

      // Initialize user preferences
      const preferences: UserPreferences = {
        language: 'en',
        dateFormat: 'PP',
        theme: DEFAULT_THEME_PREFERENCE,
        metricConfigs: DEFAULT_METRIC_CONFIGS,
        widgets: [],
        syncConfig: DEFAULT_SYNC_CONFIG,
        onboardingCompleted: true,
        permissionsGranted: granted,
        enableMultiRowLayout: false,
      };

      await SaveUserPreferences(preferences);

      if (granted) {
        // Trigger initial sync, capped at SYNC_YEARS.INITIAL so onboarding
        // stays fast; deeper history is available on demand from Settings
        setIsSyncing(true);
        try {
          await SyncAllDataFromAllTime(SYNC_YEARS.INITIAL);
        } catch (syncError) {
          console.error('Error syncing initial health data:', syncError);
          // Don't block onboarding completion if sync fails
        } finally {
          setIsSyncing(false);
        }
      }

      setStep(2); // Move to completion step either way
    } catch (err) {
      console.error('Error granting permissions:', err);
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const HandleComplete = () => {
    onComplete();
  };

  if (isLoading || isSyncing) {
    const message = isSyncing
      ? t('onboarding.syncing_data') || 'Syncing health data...'
      : t('common.loading');
    return <LoadingSpinner message={message} />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}>
      {step === 0 && (
        <View style={styles.stepContainer}>
          <Icon
            name="fitness-center"
            type="material"
            size={80}
            color={theme.colors.link}
          />
          <Text h2 style={[styles.title, { color: theme.colors.text.primary }]}>
            {t('onboarding.welcome_title')}
          </Text>
          <Text
            style={[
              styles.description,
              { color: theme.colors.text.secondary },
            ]}>
            {t('onboarding.welcome_description')}
          </Text>
          <AppButton
            title={t('common.continue')}
            onPress={() => setStep(1)}
            containerStyle={styles.buttonContainer}
            size="lg"
          />
        </View>
      )}

      {step === 1 && (
        <View style={styles.stepContainer}>
          <Icon
            name="health-and-safety"
            type="material"
            size={80}
            color={theme.colors.link}
          />
          <Text h2 style={[styles.title, { color: theme.colors.text.primary }]}>
            {t('onboarding.permissions_title')}
          </Text>
          <Text
            style={[
              styles.description,
              { color: theme.colors.text.secondary },
            ]}>
            {t('onboarding.permissions_description')}
          </Text>

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <AppButton
            title={t('common.continue')}
            onPress={HandleRequestPermissions}
            containerStyle={styles.buttonContainer}
            size="lg"
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContainer}>
          <Icon
            name={permissionsGranted ? 'check-circle' : 'info'}
            type="material"
            size={80}
            color={
              permissionsGranted ? theme.colors.success : theme.colors.link
            }
          />
          <Text h2 style={[styles.title, { color: theme.colors.text.primary }]}>
            {permissionsGranted
              ? t('onboarding.setup_complete')
              : t('errors.no_permission')}
          </Text>
          <Text
            style={[
              styles.description,
              { color: theme.colors.text.secondary },
            ]}>
            {permissionsGranted
              ? t('onboarding.setup_complete_description')
              : t('onboarding.permissions_denied_description')}
          </Text>
          <AppButton
            title={t('common.done')}
            onPress={HandleComplete}
            containerStyle={styles.buttonContainer}
            size="lg"
          />
          {!permissionsGranted && (
            <Button
              title={t('common.open_settings')}
              onPress={() => Linking.openSettings()}
              type="clear"
              containerStyle={styles.buttonContainer}
              titleStyle={{ color: theme.colors.link }}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  stepContainer: {
    alignItems: 'center',
  },
  title: {
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});
