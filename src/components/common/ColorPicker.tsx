import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Text } from '@rneui/themed';
import { useTranslation } from 'react-i18next';
import { IsValidHexColor, NormalizeHexColor } from '@utils';
import { GetSuggestedColorsForThreshold } from '@constants';

interface ColorPickerProps {
  visible: boolean;
  currentColor: string;
  thresholdIndex: number;
  onColorChange: (color: string) => void;
  onClose: () => void;
  theme: {
    mode: 'light' | 'dark';
    colors: {
      background: string;
      text: {
        primary: string;
        secondary: string;
      };
    };
  };
}

/**
 * ColorPicker Component
 * Simple color picker with hex input and suggested colors
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  currentColor,
  thresholdIndex,
  onColorChange,
  onClose,
  theme,
}) => {
  const { t } = useTranslation();
  const isDarkMode = theme.mode === 'dark';
  const [hexInput, setHexInput] = useState(currentColor);
  const [isValidColor, setIsValidColor] = useState(true);

  const suggestedColors = GetSuggestedColorsForThreshold(
    thresholdIndex,
    isDarkMode ? 'dark' : 'light'
  );

  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#8E8E93' : '#6D6D70';
  const borderColor = isDarkMode ? '#38383A' : '#E5E5EA';
  const inputBorderColor = isDarkMode ? '#48484A' : '#C6C6C8';
  const inputBackgroundColor = isDarkMode ? '#2C2C2E' : '#F2F2F7';
  const errorColor = '#FF3B30';

  const HandleHexInputChange = (value: string) => {
    setHexInput(value);

    // Normalize input (add # if missing)
    const normalized = value.startsWith('#') ? value : `#${value}`;

    if (normalized.length <= 7) {
      // Check if valid hex color
      const isValid = IsValidHexColor(normalized);
      setIsValidColor(isValid);

      if (isValid && normalized.length === 7) {
        onColorChange(NormalizeHexColor(normalized));
      }
    }
  };

  const HandleSuggestedColorPress = (color: string) => {
    const normalized = NormalizeHexColor(color);
    setHexInput(normalized);
    setIsValidColor(true);
    onColorChange(normalized);
  };

  const HandleClose = () => {
    // Reset to current color when closing
    setHexInput(currentColor);
    setIsValidColor(true);
    onClose();
  };

  // Update hex input when currentColor changes externally
  React.useEffect(() => {
    if (visible) {
      setHexInput(currentColor);
      setIsValidColor(true);
    }
  }, [currentColor, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={HandleClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor,
              borderColor,
            },
          ]}>
          <Text style={[styles.title, { color: textColor }]}>
            {t('configuration.color_picker_title')}
          </Text>

          <View style={styles.hexInputContainer}>
            <Text style={[styles.label, { color: textColor }]}>
              {t('configuration.hex_color')}
            </Text>
            <View style={styles.hexInputWrapper}>
              <View
                style={[
                  styles.colorPreview,
                  {
                    backgroundColor: isValidColor ? hexInput : errorColor,
                    borderColor: inputBorderColor,
                  },
                ]}
              />
              <TextInput
                style={[
                  styles.hexInput,
                  {
                    borderColor: isValidColor ? inputBorderColor : errorColor,
                    backgroundColor: inputBackgroundColor,
                    color: textColor,
                  },
                ]}
                value={hexInput}
                onChangeText={HandleHexInputChange}
                placeholder="#000000"
                placeholderTextColor={secondaryTextColor}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={7}
              />
            </View>
            {!isValidColor && (
              <Text style={[styles.errorText, { color: errorColor }]}>
                {t('configuration.invalid_color')}
              </Text>
            )}
          </View>

          <View style={styles.suggestedColorsContainer}>
            <Text style={[styles.label, { color: textColor }]}>
              {t('configuration.suggested_colors')}
            </Text>
            <View style={styles.suggestedColorsGrid}>
              {suggestedColors.map((color, index) => {
                const normalizedColor = NormalizeHexColor(color);
                const isSelected =
                  normalizedColor === NormalizeHexColor(currentColor);

                return (
                  <TouchableOpacity
                    key={`${color}-${index}`}
                    style={[
                      styles.suggestedColorItem,
                      {
                        backgroundColor: normalizedColor,
                        borderColor: isSelected ? textColor : borderColor,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => HandleSuggestedColorPress(color)}>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: borderColor }]}
            onPress={HandleClose}>
            <Text style={[styles.closeButtonText, { color: textColor }]}>
              {t('common.close')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  hexInputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  hexInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  hexInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  suggestedColorsContainer: {
    marginBottom: 24,
  },
  suggestedColorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  suggestedColorItem: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
