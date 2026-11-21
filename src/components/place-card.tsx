import { OpenReview } from '@/components/open-review';
import { router } from 'expo-router';
import { memo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkButton } from '@/components/bookmark-button';
import { useSavePrompt } from '@/components/save-prompt';
import { CommentButton } from '@/components/comment-button';
import { CommentsModal } from '@/components/comments-modal';
import { LikeButton } from '@/components/like-button';
import { MediaStrip } from '@/components/media-strip';
import { RatingBadge } from '@/components/ui';
import { useIsLiked, useToggleLike } from '@/hooks/use-reviews';
import { useIsSaved, useToggleSave } from '@/hooks/use-saves';
import type { Place } from '@/types/place';

// One place in the feed: header, swipeable media, action row, info, and text.
// The screen decides where tapping it goes. Saving and liking happen here, through
// the hooks in src/hooks/, so every card for the same place stays in step.

type PlaceCardProps = {
  place: Place;
  width: number; // card width, so the media height stays fixed (4:5)
  onPress: () => void; // tapping the name or the image opens Place details
};

export const PlaceCard = memo(function PlaceCard({ place, width, onPress }: PlaceCardProps) {
  // The cover image first, then every photo people posted (videos can't play in the strip)
  const photos = place.media.filter((item) => item.type === 'photo').map((item) => item.url);
  const images = [place.coverImage, ...photos];
  // The newest review shows when there is one, otherwise the description.
  const newestReview = place.reviews?.[place.reviews.length - 1];
  // The heart likes that review (docs/backend-plan.md, open decision 4).
  const isLiked = useIsLiked(newestReview?.id);
  const toggleLike = useToggleLike();
  // Saved or not comes from the shared list of saved ids, so every bookmark for
  // this place flips at once, on every screen.
  // TODO: open the "Save to collection" sheet instead of toggling directly.
  const isSaved = useIsSaved(place.id);
  const toggleSave = useToggleSave();
  const { showSavePrompt } = useSavePrompt();

  // Saving asks where it should go; un-saving says nothing. `savedTo` is the
  // collections auto add put it in, which decides what the message says.
  function handleToggleSave() {
    const save = !isSaved;

    toggleSave.mutate(
      { placeId: place.id, save },
      {
        onSuccess: (savedTo) => {
          if (save) {
            showSavePrompt({ id: place.id, name: place.name }, savedTo);
          }
        },
      },
    );
  }
  const [openCommentReviewId, setOpenCommentReviewId] = useState<string | null>(null);

  // Opens the place in the phone's maps app: Apple Maps on iOS, the default maps app on Android.
  // A place without coordinates opens by its address instead.
  function openInMaps() {
    const { latitude: lat, longitude: lng, name } = place;
    if (lat === undefined || lng === undefined) {
      Linking.openURL(place.directions).catch(() => {});
      return;
    }
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
      default: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`)
    );
  }

  function showPlaceReviews() {
    router.push({ pathname: '/place/[id]', params: { id: place.id, section: 'reviews' } });
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} accessibilityRole="button" style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{place.name}</Text>
        </View>
      </Pressable>
      <Pressable onPress={openInMaps} accessibilityRole="link" accessibilityLabel={`Open ${place.name} in maps`} style={styles.locationRow}>
        <Text style={styles.location}>
          {place.city}, {place.country}
        </Text>
      </Pressable>

      <MediaStrip images={images} width={width} onPress={onPress} onSwipePastEnd={onPress} />

      <View style={styles.actions}>
        {newestReview && (
          <LikeButton isLiked={isLiked} onPress={() => toggleLike.mutate({ reviewId: newestReview.id, like: !isLiked })} />
        )}
        {newestReview && (
          <CommentButton
            count={newestReview.commentCount ?? 0}
            onPress={() => setOpenCommentReviewId(newestReview.id)}
          />
        )}
        <BookmarkButton isSaved={isSaved} onPress={handleToggleSave} />
      </View>
      {openCommentReviewId && (
        <CommentsModal
          key={openCommentReviewId}
          reviewId={openCommentReviewId}
          onClose={() => setOpenCommentReviewId(null)}
        />
      )}

      <View style={styles.info}>
        {/* The three ratings, each a single star and a number: what everyone
            thinks, what your friends think, what the app thinks you'll think.
            Five drawn stars twice over said less and took more room -- see
            docs/design/reference/components/ratings.png.

            Friends and For you only appear when there's a number for them: no
            friends have rated it, or we can't work out a score for you yet. */}
        <View style={styles.ratings}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Average rating ${place.averageRating.toFixed(1)} out of 5. Read reviews for ${place.name}`}
            onPress={() => showPlaceReviews()}
          >
            <RatingBadge variant="average" rating={place.averageRating} />
          </Pressable>

          {place.friendsRating !== undefined && <RatingBadge variant="friends" rating={place.friendsRating} />}

          {place.algorithmRating !== undefined && <RatingBadge variant="forYou" rating={place.algorithmRating} />}
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
          <OpenReview review={newestReview} onPress={showPlaceReviews} />
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
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
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
