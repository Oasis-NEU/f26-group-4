import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import type { Place } from '@/types/place';

// The popup card on the Map: small cover image, name, "City, Country", rating, and a
// "View details" button. It also works as a plain row in the Map's fallback list.
// It doesn't navigate itself; the screen passes in what to do.

type MapPlacePreviewProps = {
  place: Place;
  onViewDetails: () => void;
  onClose?: () => void; // shows the ✕ when given
};

export function MapPlacePreview({ place, onViewDetails, onClose }: MapPlacePreviewProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: place.coverImage }} style={styles.image} contentFit="cover" />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.location}>
          {place.city}, {place.country}
        </Text>
        <RatingStars rating={place.averageRating} />
        <Pressable onPress={onViewDetails} accessibilityRole="button">
          <Text style={styles.link}>View details</Text>
        </Pressable>
      </View>
      {onClose && (
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  image: {
    width: 80,
    height: 100,
    borderRadius: 8,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  location: {
    color: '#666',
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
  close: {
    fontSize: 18,
    color: '#666',
  },
});
