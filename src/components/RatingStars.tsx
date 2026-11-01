import { StyleSheet, Text, View } from 'react-native';

// Shows a rating out of 5 as stars, with the number next to them.
// Used on place cards and Place details.

type RatingStarsProps = {
  rating: number; // 0 to 5, e.g. 4.5
  label?: string; // optional text before the stars, e.g. "Friends"
};

export function RatingStars({ rating, label }: RatingStarsProps) {
  const filled = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label ?? 'Rating'} ${rating.toFixed(1)} out of 5`}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Text style={styles.stars}>{'★'.repeat(filled) + '☆'.repeat(5 - filled)}</Text>
      <Text style={styles.number}>{rating.toFixed(1)}</Text>
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
});
