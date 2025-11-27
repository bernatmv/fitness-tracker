import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Icon } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@utils';
import { RequestHealthPermissions } from '@services/health_data';
import { SaveUserPreferences, LoadUserPreferences } from '@services/storage';
import {
  DEFAULT_METRIC_CONFIGS,
  DEFAULT_SYNC_CONFIG,
  DEFAULT_THEME_PREFERENCE,
} from '@constants';
import { MetricType, UserPreferences } from '@types';
import { LoadingSpinner } from '@components/common';

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
  const [error, setError] = useState<string | null>(null);

  const HandleGrantPermissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const granted = await RequestHealthPermissions();
      
      if (granted) {
        // Initialize user preferences
        const preferences: UserPreferences = {
          language: 'en',
          dateFormat: 'PP',
          theme: DEFAULT_THEME_PREFERENCE,
          metricConfigs: DEFAULT_METRIC_CONFIGS,
          widgets: [],
          syncConfig: DEFAULT_SYNC_CONFIG,
          onboardingCompleted: true,
          permissionsGranted: true,
          enableMultiRowLayout: false,
        };

        await SaveUserPreferences(preferences);
        setStep(2); // Move to completion step
      } else {
        setError(t('errors.no_permission'));
      }
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

  if (isLoading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {step === 0 && (
        <View style={styles.stepContainer}>
          <Icon
            name="fitness-center"
            type="material"
            size={80}
            color={theme.colors.link}
          />
          <Text h2 style={styles.title}>
            {t('onboarding.welcome_title')}
          </Text>
          <Text style={styles.description}>
            {t('onboarding.welcome_description')}
          </Text>
          <Button
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
          <Text h2 style={styles.title}>
            {t('onboarding.permissions_title')}
          </Text>
          <Text style={styles.description}>
            {t('onboarding.permissions_description')}
          </Text>
          
          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}
          
          <Button
            title={t('onboarding.permissions_button')}
            onPress={HandleGrantPermissions}
            containerStyle={styles.buttonContainer}
            size="lg"
          />
          <Button
            title={t('common.skip')}
            onPress={() => setStep(2)}
            type="clear"
            containerStyle={styles.buttonContainer}
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContainer}>
          <Icon
            name="check-circle"
            type="material"
            size={80}
            color={theme.colors.success}
          />
          <Text h2 style={styles.title}>
            {t('onboarding.setup_complete')}
          </Text>
          <Text style={styles.description}>
            {t('onboarding.setup_complete_description')}
          </Text>
          <Button
            title={t('common.done')}
            onPress={HandleComplete}
            containerStyle={styles.buttonContainer}
            size="lg"
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

