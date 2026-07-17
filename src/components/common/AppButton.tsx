import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, ButtonProps } from '@rneui/themed';
import { ToRgba, useAppTheme } from '@utils';

export type AppButtonVariant = 'primary' | 'outline' | 'destructive';

export interface AppButtonProps extends Omit<ButtonProps, 'type' | 'color'> {
  variant?: AppButtonVariant;
}

/**
 * AppButton Component
 * The app-wide button: one consistent shape (radius, height, typography)
 * with three variants. Use this instead of styling RNE Button ad hoc.
 */
export const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  buttonStyle,
  titleStyle,
  disabledStyle,
  disabledTitleStyle,
  ...rest
}) => {
  const theme = useAppTheme();

  // Filled variants intentionally use white titles in both themes (light
  // text on a saturated button); the theme has no "text on primary" token.
  const filledTitleColor = '#FFFFFF';

  const variantStyles = {
    primary: {
      button: { backgroundColor: theme.colors.primary },
      title: { color: filledTitleColor },
    },
    destructive: {
      button: { backgroundColor: theme.colors.error },
      title: { color: filledTitleColor },
    },
    outline: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
      },
      title: { color: theme.colors.primary },
    },
  }[variant];

  const disabledBackground =
    variant === 'outline'
      ? 'transparent'
      : ToRgba(
          variant === 'destructive' ? theme.colors.error : theme.colors.primary,
          0.4
        );

  return (
    <Button
      activeOpacity={0.8}
      {...rest}
      type={variant === 'outline' ? 'outline' : 'solid'}
      buttonStyle={[styles.button, variantStyles.button, buttonStyle]}
      titleStyle={[styles.title, variantStyles.title, titleStyle]}
      disabledStyle={[{ backgroundColor: disabledBackground }, disabledStyle]}
      disabledTitleStyle={[variantStyles.title, disabledTitleStyle]}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
