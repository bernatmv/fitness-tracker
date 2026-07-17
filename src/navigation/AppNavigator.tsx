import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToRgba, useAppTheme } from '@utils';
import { LiquidGlassView } from '@components/common';
import { HomeScreen } from '@screens/home';
import { SettingsScreen } from '@screens/settings';
import { MetricDetailScreen } from '@screens/metric_detail';
import { MetricConfigScreen } from '@screens/metric_detail/MetricConfigScreen';
import { MetricType, ThemePreference } from '@types';
import { TAB_PILL_HEIGHT } from '@constants';

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
  const { width: screenWidth } = useWindowDimensions();
  const pillMaxWidth = 420;
  const pillHorizontalMargin = 24;
  const pillWidth = Math.min(
    pillMaxWidth,
    Math.max(0, screenWidth - pillHorizontalMargin * 2)
  );
  const pillInset = Math.max(0, (screenWidth - pillWidth) / 2);
  const pillHeight = TAB_PILL_HEIGHT;
  const pillBottom = (Platform.OS === 'ios' ? insets.bottom : 0) + 10;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.link,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        // Soft capsule highlight behind the active tab
        tabBarActiveBackgroundColor: ToRgba(
          theme.colors.link,
          isDarkMode ? 0.24 : 0.12
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 6,
          borderRadius: 26,
          marginHorizontal: 8,
          marginVertical: 6,
        },
        // Floating pill style (Slack-style). iOS gets "liquid glass" materials; other platforms keep transparent.
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: pillHeight,
          bottom: Platform.OS === 'ios' ? pillBottom : 16,
          left: pillInset,
          right: pillInset,
          borderRadius: pillHeight / 2,
          paddingBottom: 0,
          shadowColor: theme.colors.text.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDarkMode ? 0.28 : 0.14,
          shadowRadius: 18,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <LiquidGlassView
              borderRadius={pillHeight / 2}
              style={{ height: pillHeight }}
              tintOpacity={0.95}
              tintColor={theme.colors.statCardBackground}
            />
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
        // Native screen container behind each screen; without this it
        // defaults to white and flashes during dark-mode transitions.
        contentStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          color: theme.colors.text.primary,
        },
        // iOS: translucent glass header that content scrolls under
        // (screens opt in via contentInsetAdjustmentBehavior="automatic").
        ...(Platform.OS === 'ios'
          ? {
              headerTransparent: true,
              headerBlurEffect: (theme.mode === 'dark'
                ? 'systemChromeMaterialDark'
                : 'systemChromeMaterialLight') as 'systemChromeMaterial',
            }
          : {
              headerStyle: {
                backgroundColor: theme.colors.background,
              },
            }),
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
