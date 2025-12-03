import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@utils';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

/**
 * ErrorMessage Component
 * Displays an error message with optional retry button
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        {message}
      </Text>
      {onRetry && (
        <Button
          title={t('common.retry')}
          onPress={onRetry}
          containerStyle={styles.buttonContainer}
        />
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    width: 200,
  },
});
