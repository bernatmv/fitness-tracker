import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { HomeScreen } from '@screens/home';
import { SettingsScreen } from '@screens/settings';
import { MetricDetailScreen } from '@screens/metric_detail';
import { MetricConfigScreen } from '@screens/metric_detail/MetricConfigScreen';
import { MetricType } from '@types';

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

/**
 * Main tab navigator
 */
const MainTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreenWrapper}
        options={{
          title: t('home.title'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="fitness-center" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreenWrapper}
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" type="material" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Wrapper components to handle navigation
 */
const HomeScreenWrapper = ({ navigation }: { navigation: any }) => {
  return (
    <HomeScreen
      onMetricPress={(metricType) =>
        navigation.navigate('MetricDetail', { metricType })
      }
    />
  );
};

const SettingsScreenWrapper = ({ navigation }: { navigation: any }) => {
  return (
    <SettingsScreen
      onMetricConfigPress={(metricType) =>
        navigation.navigate('MetricConfig', { metricType })
      }
    />
  );
};

/**
 * Main app navigator
 */
export const AppNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MetricDetail"
        component={MetricDetailScreenWrapper}
        options={({ route }) => ({
          title: t('metric_detail.title', { metric: route.params.metricType }),
        })}
      />
      <Stack.Screen
        name="MetricConfig"
        component={MetricConfigScreenWrapper}
        options={({ route }) => ({
          title: t('configuration.title', { metric: route.params.metricType }),
        })}
      />
    </Stack.Navigator>
  );
};

const MetricDetailScreenWrapper = ({ route, navigation }: { route: any; navigation: any }) => {
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
const MetricConfigScreenWrapper = ({ route, navigation }: { route: any; navigation: any }) => {
  const { metricType } = route.params;
  
  return (
    <MetricConfigScreen
      metricType={metricType}
      onSave={() => navigation.goBack()}
    />
  );
};

