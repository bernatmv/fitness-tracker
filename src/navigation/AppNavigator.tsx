import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import { Icon } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@utils';
import { HomeScreen } from '@screens/home';
import { SettingsScreen } from '@screens/settings';
import { MetricDetailScreen } from '@screens/metric_detail';
import { MetricConfigScreen } from '@screens/metric_detail/MetricConfigScreen';
import { MetricType, ThemePreference } from '@types';

type RootStackParamList = {
  MainTabs: undefined;
  MetricDetail: { metricType: MetricType };
  MetricConfig: { metricType: MetricType };
};

type MainTabsParamList = {
  Home: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

interface MainTabNavigatorProps {
  onThemePreferenceChange?: (preference: ThemePreference) => void;
}

/**
 * Main tab navigator
 */
const MainTabNavigator: React.FC<MainTabNavigatorProps> = ({
  onThemePreferenceChange,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const isDarkMode = theme.mode === 'dark';
  const insets = useSafeAreaInsets();
  const iosMajorVersion =
    Platform.OS === 'ios'
      ? typeof Platform.Version === 'string'
        ? parseInt(Platform.Version, 10)
        : Platform.Version
      : 0;
  const useModernIOSGlass = Platform.OS === 'ios' && iosMajorVersion >= 15;
  const blurType = useModernIOSGlass
    ? isDarkMode
      ? 'ultraThinMaterialDark'
      : 'ultraThinMaterialLight'
    : isDarkMode
      ? 'dark'
      : 'light';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.link,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarStyle: useModernIOSGlass
          ? {
              // iOS 15+: match modern "glass/material" tab bar look without breaking older iOS.
              backgroundColor: 'transparent',
              position: 'absolute',
              borderTopWidth: 0,
              elevation: 0,
              left: 0,
              right: 0,
              bottom: 0,
              height: 56 + insets.bottom,
              paddingBottom: insets.bottom,
              paddingTop: 6,
            }
          : {
              // Legacy floating pill (kept for older iOS versions)
              backgroundColor: 'transparent',
              position: 'absolute',
              borderTopWidth: 0,
              elevation: 0,
              height: 55,
              bottom: 25,
              left: 100,
              right: 100,
              borderRadius: 30,
              paddingBottom: 0, // Ensure no extra padding at bottom
              shadowColor: theme.colors.text.primary,
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.12,
              shadowRadius: 10,
            },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <View
              style={{
                borderRadius: useModernIOSGlass ? 0 : 30,
                overflow: 'hidden',
                height: useModernIOSGlass ? 56 + insets.bottom : 55,
              }}>
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType={blurType}
                blurAmount={useModernIOSGlass ? 24 : 20}
                reducedTransparencyFallbackColor={theme.colors.cardBackground}
              />
            </View>
          ) : undefined,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreenWrapper}
        options={{
          title: t('home.nav'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" type="material" color={color} size={size} />
          ),
        }}>
        {() => (
          <SettingsScreenWrapper
            onThemePreferenceChange={onThemePreferenceChange}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

/**
 * Wrapper components to handle navigation
 */
const HomeScreenWrapper = ({ navigation }: { navigation: any }) => {
  return (
    <HomeScreen
      onMetricPress={metricType =>
        navigation.navigate('MetricDetail', { metricType })
      }
    />
  );
};

interface SettingsScreenWrapperProps {
  onThemePreferenceChange?: (preference: ThemePreference) => void;
}

const SettingsScreenWrapper: React.FC<SettingsScreenWrapperProps> = ({
  onThemePreferenceChange,
}) => {
  return <SettingsScreen onThemePreferenceChange={onThemePreferenceChange} />;
};

interface AppNavigatorProps {
  onThemePreferenceChange?: (preference: ThemePreference) => void;
}

/**
 * Main app navigator
 */
export const AppNavigator: React.FC<AppNavigatorProps> = ({
  onThemePreferenceChange,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          color: theme.colors.text.primary,
        },
      }}>
      <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
        {() => (
          <MainTabNavigator onThemePreferenceChange={onThemePreferenceChange} />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="MetricDetail"
        component={MetricDetailScreenWrapper}
        options={() => ({
          title: t('metric_detail.title'),
        })}
      />
      <Stack.Screen
        name="MetricConfig"
        component={MetricConfigScreenWrapper}
        options={() => ({
          title: t('configuration.title'),
        })}
      />
    </Stack.Navigator>
  );
};

const MetricDetailScreenWrapper = ({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) => {
  const { metricType } = route.params;

  return (
    <MetricDetailScreen
      metricType={metricType}
      onConfigurePress={() =>
        navigation.navigate('MetricConfig', { metricType })
      }
    />
  );
};

/**
 * Metric configuration screen wrapper
 */
const MetricConfigScreenWrapper = ({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) => {
  const { metricType } = route.params;

  return (
    <MetricConfigScreen
      metricType={metricType}
      onSave={() => navigation.goBack()}
    />
  );
};
