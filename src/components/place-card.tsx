import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkButton } from '@/components/bookmark-button';
import { MediaStrip } from '@/components/media-strip';
import { RatingStars } from '@/components/rating-stars';
import type { Place } from '@/types/place';

// One place in the feed: header, swipeable media, action row, info, and text.
// It doesn't navigate or save anything itself; the screen passes in what to do.

type PlaceCardProps = {
  place: Place;
  width: number; // card width, so the media height stays fixed (4:5)
  onPress: () => void; // tapping the name or the image opens Place details
  onBookmarkPress: () => void;
};

export const PlaceCard = memo(function PlaceCard({ place, width, onPress, onBookmarkPress }: PlaceCardProps) {
  // The cover image first, then every photo people posted (videos can't play in the strip)
  const photos = place.media.filter((item) => item.type === 'photo').map((item) => item.url);
  const images = [place.coverImage, ...photos];
  // The newest friend review shows when there is one, otherwise the description
  const newestReview = place.reviews?.[place.reviews.length - 1];

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} accessibilityRole="button" style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{place.name}</Text>
          {place.isVerified && <Text style={styles.verified} accessibilityLabel="Verified">✓</Text>}
        </View>
        <Text style={styles.location}>
          {place.city}, {place.country}
        </Text>
      </Pressable>

      <Pressable onPress={onPress} accessibilityRole="imagebutton" accessibilityLabel={`Open ${place.name}`}>
        <MediaStrip images={images} width={width} />
      </Pressable>

      <View style={styles.actions}>
        <BookmarkButton isSaved={place.bookmark} onPress={onBookmarkPress} />
      </View>

      <View style={styles.info}>
        <View style={styles.ratings}>
          <RatingStars rating={place.averageRating} />
          {place.friendsRating !== undefined && <RatingStars rating={place.friendsRating} label="Friends" />}
        </View>
        <View style={styles.chips}>
          <Text style={[styles.chip, styles.typeChip]}>{place.placeType}</Text>
          {place.suitedFor.map((tag) => (
            <Text key={tag} style={styles.chip}>
              {tag}
            </Text>
          ))}
        </View>
        {newestReview?.reviewText ? (
          <Text numberOfLines={2}>
            <Text style={styles.name}>{newestReview.profileName} </Text>
            {newestReview.reviewText}
          </Text>
        ) : (
          place.description && <Text numberOfLines={2}>{place.description}</Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verified: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  location: {
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  info: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  ratings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  typeChip: {
    backgroundColor: '#dbeafe',
  },
});
