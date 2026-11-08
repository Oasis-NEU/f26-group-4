import { Pressable, StyleSheet, Text, View } from 'react-native';
// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, type } from '@/theme';

// Shows a rating out of 5 as stars, with the number next to them.
// Used on place cards, the Map preview and Place details.
// Pass `onChange` to turn it into a picker instead, so people can tap 1-5 (used on Upload).

type RatingStarsProps = {
  rating: number; // 0 to 5, e.g. 4.5. On the picker, 0 means nothing selected yet
  label?: string; // optional text before the stars, e.g. "Friends"
  onChange?: (rating: 1 | 2 | 3 | 4 | 5) => void; // gives the picked number back to the page
};

export function RatingStars({ rating, label, onChange }: RatingStarsProps) {
  if (onChange) {
    return <RatingPicker rating={rating} label={label} onChange={onChange} />;
  }

  const filled = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label ?? 'Rating'} ${rating.toFixed(1)} out of 5`}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Text style={styles.stars}>{'★'.repeat(filled) + '☆'.repeat(5 - filled)}</Text>
      <Text style={styles.number}>{rating.toFixed(1)}</Text>
    </View>
  );
}

type RatingPickerProps = {
  rating: number;
  label?: string;
  onChange: (rating: 1 | 2 | 3 | 4 | 5) => void;
};

function RatingPicker({ rating, label = 'Rating', onChange }: RatingPickerProps) {
  const stars = [1, 2, 3, 4, 5] as const;

  return (
    <View style={styles.picker}>
      <Text style={styles.pickerLabel}>{label}</Text>

      <View style={styles.pickerRow}>
        {stars.map((star) => (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} out of 5`}
            accessibilityState={{ selected: rating === star }}
            style={styles.pickerButton}
          >
            <Text style={styles.pickerStar}>{star <= rating ? '★' : '☆'}</Text>
          </Pressable>
        ))}
      </View>

      <Text>{rating === 0 ? 'Choose a rating' : `${rating} out of 5`}</Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: colors.textMuted,
  },
  stars: {
    color: colors.starFriends,
    fontSize: type.body,
  },
  number: {
    fontWeight: '600',
    color: colors.text,
  },
  picker: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontWeight: '500',
    fontSize: type.body,
    marginBottom: 6,
    color: colors.text,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerStar: {
    fontSize: 36,
    color: colors.starFriends,
  },
});
