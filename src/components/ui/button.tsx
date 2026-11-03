import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

// A button. Three kinds, and which one you pick says how important it is:
//
//   primary   - black, white text. The ONE main action on a screen.
//   secondary - pale blue, blue text. Everything else: Remove, Cancel, Clear.
//   link      - no background, just blue underlined text. Goes somewhere.
//
// Every button is a full oval. There's no variation on that in this design
// system, so there's no radius option here on purpose.
//
//   <Button label="Save" onPress={handleSave} />
//   <Button label="Remove" variant="secondary" onPress={handleRemove} />

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  // Where the button sits in the space it's given. By default it's only as wide
  // as its text ('start'). Use 'stretch' for a full-width button at the bottom
  // of a form, 'center' to put it in the middle.
  align?: 'start' | 'center' | 'stretch';
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  align = 'start',
  disabled = false,
}: ButtonProps) {
  let boxStyle = styles.primary;
  let textStyle = styles.primaryText;

  if (variant === 'secondary') {
    boxStyle = styles.secondary;
    textStyle = styles.secondaryText;
  }

  if (variant === 'link') {
    boxStyle = styles.link;
    textStyle = styles.linkText;
  }

  return (
    <Pressable
      // Each line below is "use this style, but only if the condition is true".
      style={[
        styles.button,
        boxStyle,
        align === 'start' && styles.alignStart,
        align === 'center' && styles.alignCenter,
        align === 'stretch' && styles.alignStretch,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  alignStart: {
    alignSelf: 'flex-start',
  },
  alignCenter: {
    alignSelf: 'center',
  },
  alignStretch: {
    alignSelf: 'stretch',
  },
  // Faded out, and Pressable ignores taps.
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontWeight: '600',
    fontSize: type.label,
  },
  primary: {
    backgroundColor: colors.ink,
  },
  primaryText: {
    color: colors.textOnDark,
  },
  secondary: {
    backgroundColor: colors.secondaryFill,
  },
  secondaryText: {
    color: colors.secondaryText,
  },
  link: {
    // No background and no padding -- a link shouldn't take up button space.
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  linkText: {
    color: colors.link,
    textDecorationLine: 'underline',
  },
});
