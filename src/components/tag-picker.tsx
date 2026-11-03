import { Pressable, StyleSheet, Text, View } from 'react-native';
// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, radius, spacing, type } from '@/theme';

type TagPickerProps = {
  // Heading above the choices.
  label: string;

  // Available choices.
  options: string[];

  // Currently selected choices.
  selected: string[];

  // Gives the updated choices back to the page.
  onChange: (selected: string[]) => void;

  // Allows several choices when true.
  multiple?: boolean;

  // Prevents changes while posting.
  disabled?: boolean;
};

export function TagPicker({
  label,
  options,
  selected,
  onChange,
  multiple = false,
  disabled = false,
}: TagPickerProps) {
  function toggleOption(option: string) {
    if (selected.includes(option)) {
      // Pressing a selected choice removes it.
      onChange(selected.filter((item) => item !== option));
    } else if (multiple) {
      onChange([...selected, option]);
    } else {
      // Only keep this choice in single-selection mode.
      onChange([option]);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <Pressable
              key={option}
              onPress={() => toggleOption(option)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{
                selected: isSelected,
                disabled,
              }}
              style={[
                styles.tag,
                isSelected && styles.selectedTag,
                disabled && styles.disabled,
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  isSelected && styles.selectedText,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
    marginBottom: 24,
  },
  label: {
    fontWeight: 'bold',
    fontSize: type.body,
    letterSpacing: -0.4,
    marginBottom: 10,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    minHeight: 44,
    justifyContent: 'center',
    // No border -- grey fill off, black on. Same as every other filter pill.
    backgroundColor: colors.fill,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  selectedTag: {
    backgroundColor: colors.ink,
  },
  tagText: {
    fontWeight: '500',
    fontSize: type.body,
    color: colors.text,
  },
  selectedText: {
    fontWeight: '600',
    color: colors.textOnDark,
  },
  disabled: {
    opacity: 0.5,
  },
});
