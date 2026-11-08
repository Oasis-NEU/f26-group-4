import { StyleSheet, Text, TextInput, View } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, radius, spacing, type } from '@/theme';

// The props this component receives.
type AuthInputProps = {
  // the text shown above the input, like "Username".
  label: string;

  // The text inside the input.
  value: string;

  // Function called with the new text when someone types.
  onChangeText: (text: string) => void;

  // Optional: hides the text when this is a password field.
  isPassword?: boolean;
};

export function AuthInput({
  label,
  value,
  onChangeText,
  isPassword = false,
}: AuthInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* THEME CODE: the placeholderTextColor below is the only design-system
          value outside the styles block. */}
      <TextInput
        style={styles.input}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isPassword}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// THEME CODE (design system) -- Ruby
//
// Colours, corner radius and spacing now come from src/theme.ts instead of
// being typed in here. These are LOOKS ONLY -- no logic changed, nothing moved,
// no props changed. Anything marked THEME CODE is safe to ignore while you work.
//
// To change a colour, change it in src/theme.ts so every screen updates, rather
// than putting a hex code back in here.
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontWeight: '500',
    fontSize: type.body,
    marginBottom: 6,
    color: colors.text,
  },
  input: {
    // The grey fill replaces the old border. Nothing in this design system is
    // outlined -- things separate by being a different colour.
    backgroundColor: colors.fill,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: type.body,
    color: colors.text,
  },
});