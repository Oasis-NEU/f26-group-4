import { Pressable, StyleSheet, Text, View } from 'react-native';

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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: '#666',
  },
  stars: {
    color: '#F5A623',
    fontSize: 16,
  },
  number: {
    fontWeight: '600',
  },
  picker: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 6,
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
    color: '#946200',
  },
});
