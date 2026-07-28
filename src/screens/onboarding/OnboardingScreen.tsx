import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Button, Text, Icon } from '@rneui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ToRgba, useAppTheme } from '@utils';
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

const TOTAL_STEPS = 3;

/**
 * OnboardingScreen Component
 * First-time setup and permissions flow
 */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
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

  const stepConfigs = [
    {
      icon: 'fitness-center',
      color: theme.colors.link,
      title: t('onboarding.welcome_title'),
      description: t('onboarding.welcome_description'),
      buttonTitle: t('common.continue'),
      onPress: () => setStep(1),
    },
    {
      icon: 'health-and-safety',
      color: theme.colors.link,
      title: t('onboarding.permissions_title'),
      description: t('onboarding.permissions_description'),
      buttonTitle: t('common.continue'),
      onPress: HandleRequestPermissions,
    },
    {
      icon: permissionsGranted ? 'check-circle' : 'info',
      color: permissionsGranted ? theme.colors.success : theme.colors.link,
      title: permissionsGranted
        ? t('onboarding.setup_complete')
        : t('errors.no_permission'),
      description: permissionsGranted
        ? t('onboarding.setup_complete_description')
        : t('onboarding.permissions_denied_description'),
      buttonTitle: t('common.done'),
      onPress: HandleComplete,
    },
  ];
  const current = stepConfigs[step];
  const showSettingsLink = step === 2 && !permissionsGranted;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 24) },
      ]}>
      <View style={styles.body}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: ToRgba(current.color, 0.12) },
          ]}>
          <Icon
            name={current.icon}
            type="material"
            size={64}
            color={current.color}
          />
        </View>
        <Text h2 style={[styles.title, { color: theme.colors.text.primary }]}>
          {current.title}
        </Text>
        <Text
          style={[styles.description, { color: theme.colors.text.secondary }]}>
          {current.description}
        </Text>
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step
                  ? [
                      styles.dotActive,
                      { backgroundColor: theme.colors.primary },
                    ]
                  : { backgroundColor: theme.colors.divider },
              ]}
            />
          ))}
        </View>
        <AppButton
          title={current.buttonTitle}
          onPress={current.onPress}
          containerStyle={styles.buttonContainer}
          size="lg"
        />
        {showSettingsLink && (
          <Button
            title={t('common.open_settings')}
            onPress={() => Linking.openSettings()}
            type="clear"
            containerStyle={styles.buttonContainer}
            titleStyle={{ color: theme.colors.link }}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    width: 136,
    height: 136,
    borderRadius: 68,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 12,
  },
});
