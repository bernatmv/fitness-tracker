import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@rneui/themed';
import './locales/i18n';
import { AppNavigator } from './navigation/AppNavigator';
import { OnboardingScreen } from './screens/onboarding';
import { LoadingSpinner } from './components/common';
import {
  LoadUserPreferences,
  SaveUserPreferences,
  LoadHealthData,
} from './services/storage';
import { MigrateToAppGroup } from './services/storage/migrate_to_app_group';
import { GetTheme, DEFAULT_THEME_PREFERENCE } from './utils';
import { SyncAllDataFromAllTime, SyncOnAppActive } from './services/sync';
import type { ThemePreference } from './types';

/**
 * Main App Component
 */
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    DEFAULT_THEME_PREFERENCE
  );
  const appState = useRef(AppState.currentState);

  const HandleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground
      try {
        await SyncOnAppActive();
      } catch (error) {
        // Silently fail - don't block app from loading
        console.error('Error syncing on app active:', error as Error);
      }
    }

    appState.current = nextAppState;
  };

  useEffect(() => {
    // Migrate data to App Group storage on app start (for widget access)
    MigrateToAppGroup().catch(error => {
      console.warn('Migration to App Group failed:', error);
    });

    CheckOnboardingStatus();
    LoadThemePreference();

    // Sync health data on initial app open
    SyncOnAppActive().catch((error: unknown) => {
      // Silently fail - don't block app from loading
      console.error('Error syncing on initial app open:', error);
    });

    // Listen for app state changes
    const subscription = AppState.addEventListener(
      'change',
      HandleAppStateChange
    );

    return () => {
      subscription.remove();
    };
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

  const HandleOnboardingComplete = async () => {
    setShowOnboarding(false);
    LoadThemePreference();

    // Check if we should trigger initial sync
    // This handles the case where permissions were granted during onboarding
    try {
      const preferences = await LoadUserPreferences();
      if (preferences?.permissionsGranted) {
        const healthData = await LoadHealthData();
        // If no health data exists or last sync is very old, trigger initial sync
        if (!healthData || !healthData.lastFullSync) {
          try {
            await SyncAllDataFromAllTime();
          } catch (syncError) {
            console.error('Error syncing initial health data:', syncError);
            // Don't block app from loading if sync fails
          }
        }
      }
    } catch (error) {
      console.error('Error checking for initial sync:', error);
    }
  };

  const HandleThemePreferenceChange = (preference: ThemePreference) => {
    setThemePreference(preference);
  };

  const currentTheme = GetTheme(themePreference);
  const statusBarStyle =
    currentTheme.mode === 'dark' ? 'light-content' : 'dark-content';

  if (isLoading) {
    const loadingTheme = GetTheme(DEFAULT_THEME_PREFERENCE);
    return (
      <SafeAreaProvider>
        <ThemeProvider theme={loadingTheme}>
          <View
            style={[
              styles.container,
              { backgroundColor: loadingTheme.colors.background },
            ]}>
            <StatusBar barStyle="dark-content" />
            <LoadingSpinner />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <ThemeProvider theme={currentTheme}>
          <View
            style={[
              styles.container,
              { backgroundColor: currentTheme.colors.background },
            ]}>
            <StatusBar barStyle={statusBarStyle} />
            <OnboardingScreen onComplete={HandleOnboardingComplete} />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={currentTheme}>
        <View
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
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
