import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Appearance } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@rneui/themed';
import './locales/i18n';
import { AppNavigator } from './navigation/AppNavigator';
import { OnboardingScreen } from './screens/onboarding';
import { LoadingSpinner } from './components/common';
import {
  LoadUserPreferences,
  SaveUserPreferences,
} from './services/storage';
import { GetTheme, DEFAULT_THEME_PREFERENCE } from './utils';
import type { ThemePreference } from './types';

/**
 * Main App Component
 */
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [themePreference, setThemePreference] =
    useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const [systemColorScheme, setSystemColorScheme] = useState<
    'light' | 'dark'
  >(() => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'));

  useEffect(() => {
    CheckOnboardingStatus();
    LoadThemePreference();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });

    return () => subscription.remove();
  }, []);

  const LoadThemePreference = async () => {
    try {
      const preferences = await LoadUserPreferences();
      if (preferences?.theme) {
        setThemePreference(preferences.theme);
      } else if (preferences) {
        // Migrate old preferences without theme
        const updatedPreferences = {
          ...preferences,
          theme: DEFAULT_THEME_PREFERENCE,
        };
        await SaveUserPreferences(updatedPreferences);
        setThemePreference(DEFAULT_THEME_PREFERENCE);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const CheckOnboardingStatus = async () => {
    try {
      const preferences = await LoadUserPreferences();
      setShowOnboarding(!preferences?.onboardingCompleted);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  const HandleOnboardingComplete = () => {
    setShowOnboarding(false);
    LoadThemePreference();
  };

  const HandleThemePreferenceChange = (preference: ThemePreference) => {
    setThemePreference(preference);
  };

  const currentTheme = GetTheme(themePreference);
  const statusBarStyle =
    currentTheme.mode === 'dark' ? 'light-content' : 'dark-content';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (showOnboarding) {
    return (
      <ThemeProvider theme={currentTheme}>
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: currentTheme.colors.background },
          ]}>
          <StatusBar barStyle={statusBarStyle} />
          <OnboardingScreen onComplete={HandleOnboardingComplete} />
        </SafeAreaView>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: currentTheme.colors.background },
        ]}>
        <StatusBar barStyle={statusBarStyle} />
        <NavigationContainer>
          <AppNavigator
            onThemePreferenceChange={HandleThemePreferenceChange}
          />
        </NavigationContainer>
      </SafeAreaView>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

