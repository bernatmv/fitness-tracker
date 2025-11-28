import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
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

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.link,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
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
          backgroundColor: isDarkMode ? '#000000' : theme.colors.background,
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
