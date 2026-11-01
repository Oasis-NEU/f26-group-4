import { Pressable, StyleSheet, Text, View } from 'react-native';

type RatingStarsProps = {
  // The selected rating. Zero means nothing selected.
  rating: number;

  // Gives the selected number back to the page.
  onChange: (rating: 1 | 2 | 3 | 4 | 5) => void;
};

export function RatingStars({
  rating,
  onChange,
}: RatingStarsProps) {
  const stars = [1, 2, 3, 4, 5] as const;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rating</Text>

      <View style={styles.row}>
        {stars.map((star) => (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} out of 5`}
            accessibilityState={{ selected: rating === star }}
            style={styles.button}
          >
            <Text style={styles.star}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text>
        {rating === 0 ? 'Choose a rating' : `${rating} out of 5`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontSize: 36,
    color: '#946200',
  },
});