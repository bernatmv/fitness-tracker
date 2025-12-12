import React from 'react';
import { StyleSheet, Platform, View, useWindowDimensions } from 'react-native';
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
  const { width: screenWidth } = useWindowDimensions();
  const toRgba = (hex: string, alpha: number): string => {
    const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
    if (normalized.length !== 6) return hex;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some(n => Number.isNaN(n))) return hex;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const iosMajorVersion =
    Platform.OS === 'ios'
      ? typeof Platform.Version === 'string'
        ? parseInt(Platform.Version, 10)
        : Platform.Version
      : 0;
  const useModernIOSGlass = Platform.OS === 'ios' && iosMajorVersion >= 15;
  const blurType = useModernIOSGlass
    ? isDarkMode
      ? 'chromeMaterialDark'
      : 'chromeMaterialLight'
    : isDarkMode
      ? 'dark'
      : 'light';
  const glassFallbackColor = toRgba(
    useModernIOSGlass ? theme.colors.cardBackground : theme.colors.background,
    useModernIOSGlass ? 0.72 : 0.9
  );
  const pillMaxWidth = 420;
  const pillHorizontalMargin = 24;
  const pillWidth = Math.min(
    pillMaxWidth,
    Math.max(0, screenWidth - pillHorizontalMargin * 2)
  );
  const pillInset = Math.max(0, (screenWidth - pillWidth) / 2);
  const pillHeight = 58;
  const pillBottom = (Platform.OS === 'ios' ? insets.bottom : 0) + 10;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.link,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarItemStyle: {
          paddingVertical: 6,
          borderRadius: 20,
          marginHorizontal: 6,
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
            <View
              style={{
                borderRadius: pillHeight / 2,
                overflow: 'hidden',
                height: pillHeight,
              }}>
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType={blurType}
                blurAmount={useModernIOSGlass ? 24 : 20}
                reducedTransparencyFallbackColor={glassFallbackColor}
              />
              {/* Tint/border overlay so it still looks "glassy" even if blur is disabled */}
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: glassFallbackColor,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: toRgba(
                      theme.colors.divider,
                      isDarkMode ? 0.35 : 0.5
                    ),
                  },
                ]}
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
