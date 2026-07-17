import React from 'react';
import { Platform, StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { ToRgba, useAppTheme } from '@utils';

interface LiquidGlassViewProps {
  /** Corner radius of the glass surface (0 for edge-to-edge headers) */
  borderRadius?: number;
  /** Hairline border overlay so the surface reads as glass even without blur */
  showBorder?: boolean;
  /**
   * Height of a soft fade rendered just below the surface so scrolling
   * content doesn't cut off abruptly. Positioned absolutely, so it overlaps
   * the content underneath instead of taking layout space.
   */
  fadeEdgeHeight?: number;
  /**
   * Opacity of the tint layer over the blur. Higher values make the surface
   * read more solid (defaults keep the airy glass look).
   */
  tintOpacity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const FADE_STEPS = 6;

/**
 * LiquidGlassView Component
 * The app's shared translucent "liquid glass" surface: iOS gets a real
 * material blur, other platforms a translucent tint fallback. Used by the
 * floating tab pill and scroll-under headers.
 */
export const LiquidGlassView: React.FC<LiquidGlassViewProps> = ({
  borderRadius = 0,
  showBorder = true,
  fadeEdgeHeight = 0,
  tintOpacity,
  style,
  children,
}) => {
  const theme = useAppTheme();
  const isDarkMode = theme.mode === 'dark';

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
  const glassFallbackColor = ToRgba(
    useModernIOSGlass ? theme.colors.cardBackground : theme.colors.background,
    tintOpacity ?? (useModernIOSGlass ? 0.72 : 0.9)
  );

  return (
    <View style={style}>
      <View style={[styles.glass, { borderRadius }]}>
        {Platform.OS === 'ios' && (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={blurType}
            blurAmount={useModernIOSGlass ? 24 : 20}
            reducedTransparencyFallbackColor={glassFallbackColor}
          />
        )}
        {/* Tint/border overlay so it still looks "glassy" even if blur is disabled */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: glassFallbackColor,
              borderRadius,
              ...(showBorder
                ? {
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: ToRgba(
                      theme.colors.divider,
                      isDarkMode ? 0.35 : 0.5
                    ),
                  }
                : {}),
            },
          ]}
        />
        {children}
      </View>
      {fadeEdgeHeight > 0 && (
        <View
          pointerEvents="none"
          style={[styles.fadeEdge, { height: fadeEdgeHeight }]}>
          {Array.from({ length: FADE_STEPS }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: ToRgba(
                  theme.colors.background,
                  0.4 * (1 - i / FADE_STEPS)
                ),
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
  },
  fadeEdge: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
  },
});
