import { memo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkButton } from '@/components/bookmark-button';
import { CommentButton } from '@/components/comment-button';
import { CommentsModal } from '@/components/comments-modal';
import { LikeButton } from '@/components/like-button';
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
  // Likes aren't stored anywhere yet, so this only lasts while the card is on screen
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const comments = place.reviews ?? [];

  // Opens the place in the phone's maps app: Apple Maps on iOS, the default maps app on Android
  function openInMaps() {
    const { latitude: lat, longitude: lng, name } = place;
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
      default: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`)
    );
  }

  const newestReview = place.reviews?.[place.reviews.length - 1];

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} accessibilityRole="button" style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{place.name}</Text>
          {place.isVerified && <Text style={styles.verified} accessibilityLabel="Verified">✓</Text>}
        </View>
      </Pressable>
      <Pressable onPress={openInMaps} accessibilityRole="link" accessibilityLabel={`Open ${place.name} in maps`} style={styles.locationRow}>
        <Text style={styles.location}>
          {place.city}, {place.country}
        </Text>
      </Pressable>

      <MediaStrip images={images} width={width} onPress={onPress} onSwipePastEnd={onPress} />

      <View style={styles.actions}>
        <LikeButton isLiked={isLiked} onPress={() => setIsLiked((prev) => !prev)} />
        <CommentButton count={comments.length} onPress={() => setShowComments(true)} />
        <BookmarkButton isSaved={place.bookmark} onPress={onBookmarkPress} />
      </View>
      <CommentsModal visible={showComments} comments={comments} onClose={() => setShowComments(false)} />

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
    paddingTop: 8,
  },
  locationRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignSelf: 'flex-start',
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
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
