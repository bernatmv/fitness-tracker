import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { AppButton } from '../AppButton';
import { LIGHT_THEME } from '@constants';

/**
 * Find the flattened style of the inner view RNE Button applies
 * `buttonStyle` to (the first descendant with a backgroundColor).
 */
const FindButtonStyle = (
  root: ReactTestInstance
): Record<string, unknown> | null => {
  const nodes = root.findAll(node => {
    const flat = StyleSheet.flatten(node.props?.style);
    return !!flat && flat.backgroundColor !== undefined;
  });
  return nodes.length > 0 ? StyleSheet.flatten(nodes[0].props.style) : null;
};

describe('AppButton', () => {
  it('renders the title and fires onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppButton title="Sync Now" onPress={onPress} />
    );

    fireEvent.press(getByText('Sync Now'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses the theme primary color for the primary variant', () => {
    const { root } = render(<AppButton title="Save" variant="primary" />);

    const style = FindButtonStyle(root);
    expect(style?.backgroundColor).toBe(LIGHT_THEME.colors.primary);
  });

  it('uses the theme error color for the destructive variant', () => {
    const { root } = render(<AppButton title="Clear" variant="destructive" />);

    const style = FindButtonStyle(root);
    expect(style?.backgroundColor).toBe(LIGHT_THEME.colors.error);
  });

  it('renders the outline variant with a transparent background and border', () => {
    const { root } = render(<AppButton title="Configure" variant="outline" />);

    const style = FindButtonStyle(root);
    expect(style?.backgroundColor).toBe('transparent');
    expect(style?.borderColor).toBe(LIGHT_THEME.colors.primary);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppButton title="Save" onPress={onPress} disabled />
    );

    fireEvent.press(getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
