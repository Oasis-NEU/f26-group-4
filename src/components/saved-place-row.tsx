import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Place } from '@/types/place';

// One place shown as a row: a thumbnail on the left with its rating in the
// corner, then the name and a line of details.
// Built the same way as search-result-card.tsx (Folake's), which is also a row
// with an image and text.

type SavedPlaceRowProps = {
  place: Place;
  onPress?: () => void;
  onRemove?: () => void; // optional, so the row can be used without a Remove button
};

export function SavedPlaceRow({ place, onPress, onRemove }: SavedPlaceRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.thumbnailArea}>
        {/* Colored block instead of a photo for now.
            TODO: swap for <Image source={place.coverImage} style={styles.thumbnail} />. */}
        <View style={styles.thumbnail} />

        {/* The rating badge, sitting in the corner of the thumbnail */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>★ {place.averageRating.toFixed(1)}</Text>
        </View>
      </View>

      {/* flex: 1 makes this take up the leftover space, so long text wraps
          instead of pushing the Remove button off the screen */}
      <View style={styles.textArea}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.details}>
          {place.city}, {place.country} · {place.placeType}
        </Text>
      </View>

      {/* Only shown when the parent passes an onRemove function */}
      {onRemove !== undefined && (
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
  },
  thumbnailArea: {
    position: 'relative',
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  textArea: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 13,
    color: '#555555',
  },
  removeButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeText: {
    fontSize: 12,
  },
});
