import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

// The Feed / List switch. Two options, one of them always on.
//
// It's built out of the same parts as FilterPill -- grey field, the selected
// side goes solid black -- so a screen with both on it doesn't look like it
// borrowed controls from two different apps. The difference is that this one
// can't be switched off: something is always selected.
//
//   <ViewToggle value={view} onChange={setView} options={['feed', 'list']} />

type ViewToggleProps<T extends string> = {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  // What to announce and display for each option, if the raw value isn't it.
  labels?: Record<T, string>;
};

export function ViewToggle<T extends string>({ value, options, onChange, labels }: ViewToggleProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => onChange(option)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{labels?.[option] ?? option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.fill,
    borderRadius: radius.round,
    alignSelf: 'flex-start', // stops it stretching across the whole row
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.round,
  },
  optionSelected: {
    backgroundColor: colors.ink,
  },
  text: {
    fontWeight: '500',
    fontSize: type.label,
    color: colors.text,
  },
  textSelected: {
    fontWeight: '600',
    color: colors.textOnDark,
  },
});
