import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@utils';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

/**
 * LoadingSpinner Component
 * Displays a loading indicator with optional message
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={theme.mode === 'dark' ? '#FFFFFF' : theme.colors.primary}
      />
      {message && (
        <Text style={styles.message}>{message || t('common.loading')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});
