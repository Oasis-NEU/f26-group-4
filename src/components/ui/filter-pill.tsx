import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';
import { getTagEmoji } from '@/utils/tag-emoji';

// One pill in a filter row: "All", "Switzerland", "cafe".
// Grey when it's off, solid black when it's on.
//
// Why black and not a brand colour: in this design system colour means
// IDENTITY -- which collection or category something belongs to. If a selected
// filter went pink, it would look like it belonged to something. Black has no
// meaning of its own, so it reads as plain "switched on".
//
//   <FilterPill label="All" selected={filter === 'All'} onPress={...} />

type FilterPillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function FilterPill({ label, selected, onPress }: FilterPillProps) {
  const emoji = getTagEmoji(label);

  return (
    <Pressable
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {/* The text has to change too -- black on black can't be read. */}
      <Text style={[styles.text, selected && styles.textSelected]}>
        {emoji !== '' ? emoji + ' ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.fill,
    borderRadius: radius.round,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
  },
  pillSelected: {
    backgroundColor: colors.ink,
  },
  text: {
    fontWeight: '500',
    fontSize: type.label,
    color: colors.text,
  },
  textSelected: {
    // Heavier as well as white, so it reads as "on" and not just "different".
    fontWeight: '600',
    color: colors.textOnDark,
  },
});
