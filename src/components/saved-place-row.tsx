import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Place } from '@/types/place';
import { colors, radius, spacing, type } from '@/theme';
import { Button, CornerRating } from '@/components/ui';

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
        <Image source={{ uri: place.coverImage }} style={styles.thumbnail} contentFit="cover" />

        {/* The rating, sitting in the corner of the thumbnail. */}
        <CornerRating rating={place.averageRating} />
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
      {onRemove !== undefined && <Button label="Remove" variant="secondary" onPress={onRemove} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.fill,
    borderRadius: radius.card,
  },
  thumbnailArea: {
    position: 'relative',
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: radius.image,
    backgroundColor: colors.line,
  },
  textArea: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
    fontSize: type.body,
    color: colors.text,
  },
  details: {
    fontSize: type.label,
    color: colors.textMuted,
  },
});
