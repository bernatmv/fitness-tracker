import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@rneui/themed';
import './locales/i18n';
import { AppNavigator } from './navigation/AppNavigator';
import { OnboardingScreen } from './screens/onboarding';
import { LoadingSpinner } from './components/common';
import { LoadUserPreferences } from './services/storage';
import { LIGHT_THEME } from './constants';

/**
 * Main App Component
 */
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    CheckOnboardingStatus();
  }, []);

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
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (showOnboarding) {
    return (
      <ThemeProvider theme={LIGHT_THEME}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <OnboardingScreen onComplete={HandleOnboardingComplete} />
        </SafeAreaView>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={LIGHT_THEME}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <AppNavigator />
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

