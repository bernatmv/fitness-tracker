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
  const insets = useSafeAreaInsets();
  const isDarkMode = theme.mode === 'dark';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.link,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarStyle: {
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
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.2,
          shadowRadius: 5,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <View style={{ borderRadius: 30, overflow: 'hidden', height: 55 }}>
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType={isDarkMode ? 'dark' : 'light'}
                blurAmount={20}
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
  navigation: any;
  onThemePreferenceChange?: (preference: ThemePreference) => void;
}

const SettingsScreenWrapper: React.FC<SettingsScreenWrapperProps> = ({
  navigation,
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

  const isDarkMode = theme.mode === 'dark';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : theme.colors.text.primary,
        headerTitleStyle: {
          color: isDarkMode ? '#FFFFFF' : theme.colors.text.primary,
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
