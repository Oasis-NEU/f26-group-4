import { ReviewPhotoViewer } from '@/components/review-photo-viewer';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useIsSaved, useToggleSave } from '@/hooks/use-saves';
import { Place } from '@/types/place';
import { getCountryFlag } from '@/utils/country-flags';
import { colors, radius, spacing, type } from '@/theme';
import { RatingBadge, Tag } from '@/components/ui';

// Shows everything about one place. The screen (src/app/(tabs)/(profile,map,explore,saved)/place/[id].tsx) finds the
// place and hands it here; this component only displays what it's given.

type PlaceDetailsProps = {
  place: Place;
  startAtReviews?: boolean;
};

export function PlaceDetails({ place, startAtReviews = false }: PlaceDetailsProps) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const reviewsTop = useRef(0);
  const jumpOnLayout = useRef(startAtReviews);
  const [openedReviewId, setOpenedReviewId] = useState<string>();
  const reviews = place.reviews ?? [];

  // Whether the place is saved. It comes from the shared list of saved ids, so
  // it matches the bookmark on every other screen.
  // TODO: tapping it should open the "save to collection" sheet instead of just toggling.
  const isBookmarked = useIsSaved(place.id);
  const toggleSave = useToggleSave();

  // Some sizes depend on how big the phone is, so they have to be measured
  const window = useWindowDimensions();

  // The photo is about 35% of the screen height
  const coverHeight = window.height * 0.35;

  // I want 2.5 posts visible at once, so you can tell there are more to the right
  // The strip starts 16 from the left, and each post has a 12 gap after it
  const postWidth = (window.width - spacing.lg) / 2.5 - spacing.md;

  // place.proximity is in meters. Anything over 1000 reads better in kilometers.
  // It's missing until the app knows where the phone is (expo-location), and then
  // the badge just doesn't show.
  // TODO: is there a way to have this automatically convert to user's preffered units?
  // maybe the user could even prefer to have it in minutes of walking instead of distance
  let distanceText: string | undefined;
  if (place.proximity !== undefined) {
    distanceText =
      place.proximity >= 1000 ? (place.proximity / 1000).toFixed(1) + ' km away' : place.proximity + ' m away';
  }

  // Empty string when we don't have a flag for that country, so the text doesn't look off
  const flag = getCountryFlag(place.country);

  function handleBack() {
    // router.back() only works if there's a screen to go back TO. If someone opens
    // this page straight from a link, there's no history and the button does nothing,
    // so send them to the feed instead.

    //need to add more navigation in general
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  function scrollToReviews(animated = true) {
    scroll.current?.scrollTo({ y: reviewsTop.current, animated });
  }

  function handleBookmark() {
    toggleSave.mutate({ placeId: place.id, save: !isBookmarked });
  }

  function handleShare() {
    Share.share({ message: place.name + ' - ' + place.address });
  }

  function handleDirections() {
    Linking.openURL(place.directions);
  }

  function handleWebsite() {
    // Only called when place.website exists, but TypeScript doesn't know that,
    // so check again here.
    if (place.website !== undefined) {
      Linking.openURL(place.website);
    }
  }

  return (
    <ScrollView ref={scroll} style={styles.page}>
      {/* The main photo. For now it's just a colored block 
          TODO: swap this View for <Image source={place.coverImage} /> later.
          Everything inside it uses `position: absolute`, which is what makes the
          buttons sit on top of the photo instead of below it. */}
      <View style={[styles.coverBlock, { height: coverHeight }]}>
        <Text style={styles.placeholderLabel}>Primary image</Text>

        <Pressable style={[styles.overlayButton, styles.backButton]} onPress={handleBack}>
          <Text style={styles.overlayButtonText}>Back</Text>
        </Pressable>

        <View style={styles.topRightButtons}>
          <Pressable style={styles.overlayButton} onPress={handleShare}>
            <Text style={styles.overlayButtonText}>Share</Text>
          </Pressable>

          <Pressable
            style={[styles.overlayButton, isBookmarked && styles.overlayButtonFilled]}
            onPress={handleBookmark}
          >
            <Text style={styles.overlayButtonText}>{isBookmarked ? 'Saved' : 'Save'}</Text>
          </Pressable>

          {/* TODO: Preselect this place when the upload form supports it. */}
          <Pressable
            accessibilityRole="button"
            style={styles.overlayButton}
            onPress={() => router.push('/upload')}
          >
            <Text style={styles.overlayButtonText}>Post</Text>
          </Pressable>
        </View>

        {/* How far away it is, in the bottom-left corner of the photo */}
        {distanceText !== undefined && (
          <View style={[styles.overlayButton, styles.distanceBadge]}>
            <Text style={styles.overlayButtonText}>{distanceText}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Name on the left, the three ratings on the right.
            `justifyContent: 'space-between'` is what pushes them apart. */}
        <View style={styles.titleRow}>
          <View style={styles.titleArea}>
            <Text style={styles.title}>{place.name}</Text>
          </View>

          {/* Friends' and "for you" are optional, so each one is checked first.
              The badge itself is a design-system component -- the three kinds
              look different on purpose, see src/components/ui/rating-badge.tsx. */}
          <View style={styles.ratingRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Average rating ${place.averageRating.toFixed(1)} out of 5. Read reviews for ${place.name}`}
              onPress={() => scrollToReviews()}
            >
              <RatingBadge variant="average" rating={place.averageRating} />
            </Pressable>

            {place.friendsRating !== undefined && (
              <RatingBadge variant="friends" rating={place.friendsRating} />
            )}

            {place.algorithmRating !== undefined && (
              <RatingBadge variant="forYou" rating={place.algorithmRating} />
            )}
          </View>
        </View>

        {/* The flag comes from src/utils/country-flags.ts */}
        <Text style={styles.subtitle}>
          {flag} {place.city}, {place.country} · {place.placeType}
        </Text>

        {/* Plain links, not buttons. The dot between them only shows when there
            are two links to separate. */}
        <View style={styles.linkRow}>
          {place.website !== undefined && (
            <>
              <Pressable onPress={handleWebsite}>
                <Text style={styles.link}>Website</Text>
              </Pressable>
              <Text style={styles.linkSeparator}>·</Text>
            </>
          )}
          {/* Tapping the address opens it in the maps app */}
          <Pressable onPress={handleDirections}>
            <Text style={styles.link}>Directions</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionHeading}>Best suited for</Text>

        {/* One pill per tag. .map() turns the array of strings into a list of Tags. */}
        <View style={styles.chipRow}>
          {place.suitedFor.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </View>

        {/* The AI summary (using all of the reviews) Hidden when the place doesn't have one yet. */}
        {place.aiSummary !== undefined && (
          <>
            <Text style={styles.sectionHeading}>Summary</Text>
            <Text style={styles.summary}>{place.aiSummary}</Text>
            <Text style={styles.summaryNote}>Summarised from posts</Text>
          </>
        )}
      </View>

      <View
        onLayout={({ nativeEvent }) => {
          reviewsTop.current = nativeEvent.layout.y;
          if (jumpOnLayout.current) {
            jumpOnLayout.current = false;
            requestAnimationFrame(() => scrollToReviews(false));
          }
        }}
      >
        <Text accessibilityRole="header" style={styles.sectionHeadingWide}>Posts</Text>

        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>No posts yet.</Text>
        ) : (
          <ScrollView horizontal contentContainerStyle={styles.postStrip} showsHorizontalScrollIndicator>
            {reviews.map((review) => {
              const photo = review.media.find((item) => item.type === 'photo' && item.url.trim());
              return (
                <View key={review.id} style={[styles.postCard, { width: postWidth }]}>
                  <Pressable
                    style={styles.postImage}
                    disabled={!photo}
                    accessibilityRole="button"
                    accessibilityLabel={`Open photos by ${review.profileName}`}
                    onPress={() => setOpenedReviewId(review.id)}
                  >
                    {photo ? (
                      <Image source={{ uri: photo.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Text style={styles.placeholderLabel}>No photo</Text>
                    )}
                  </Pressable>
                  <Text
                    style={styles.postAuthor}
                    accessibilityRole="link"
                    onPress={() => {
                      if (review.authorId) {
                        router.push({ pathname: '/user/[id]', params: { id: review.authorId } });
                      }
                    }}
                  >{review.profileName}</Text>
                  <Text style={styles.postRating}>
                    <Text style={styles.starPost}>★</Text> {review.rating} / 5
                  </Text>
                  {!!review.reviewText?.trim() && (
                    <Text style={styles.postText} numberOfLines={3}>{review.reviewText}</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
        {openedReviewId && (
          <ReviewPhotoViewer
            key={openedReviewId}
            reviews={reviews}
            initialReviewId={openedReviewId}
            onClose={() => setOpenedReviewId(undefined)}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  coverBlock: {
    width: '100%',
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // lets the buttons sit on top using `position: absolute`
  },
  placeholderLabel: {
    fontSize: type.label,
    color: colors.textMuted,
  },
  // The shape shared by every button sitting on the photo.
  overlayButton: {
    // Slightly see-through white, so you can tell there's a photo underneath
    // instead of a solid sticker sitting on it.
    backgroundColor: colors.overlay,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  overlayButtonFilled: {
    // Saved turns yellow. It's the one place in the app where a brand colour
    // means a state rather than an identity, and it's deliberate -- saving is
    // the thing we most want people to notice they've done.
    backgroundColor: colors.saved,
  },
  overlayButtonText: {
    fontWeight: '500',
    fontSize: type.label,
    color: colors.overlayIcon,
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
  },
  topRightButtons: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
  },
  body: {
    padding: spacing.lg,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleArea: {
    flex: 1, // takes the leftover space, so the name wraps instead of squashing the ratings
    gap: 6,
  },
  title: {
    // The display font is already extra-bold, so there's no fontWeight here.
    // Setting both would make it heavier than designed, or get ignored.
    fontWeight: 'bold',
    fontSize: type.title,
    letterSpacing: -0.8, // the design tracks headings in tight

    color: colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 6,
  },
  starPost: {
    color: colors.cornerBadgeStar,
  },
  subtitle: {
    fontSize: type.body,
    color: colors.textMuted,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  link: {
    fontWeight: '500',
    fontSize: type.body,
    // Links are the one thing that's blue. Nothing else in the interface is,
    // so blue reads as "this goes somewhere" without needing to say so.
    color: colors.link,
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: type.body,
    color: colors.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // tags move onto a second line instead of running off the edge
    gap: spacing.sm,
  },
  summary: {
    fontSize: type.body,
    lineHeight: 22,
    color: colors.text,
  },
  summaryNote: {
    fontSize: type.small,
    color: colors.textMuted,
  },
  sectionHeading: {
    fontWeight: 'bold',
    fontSize: type.heading,
    letterSpacing: -0.5,
    paddingTop: spacing.sm,
    color: colors.text,
  },
  // Same as sectionHeading, but for the bits that sit outside the padded body.
  sectionHeadingWide: {
    fontWeight: 'bold',
    fontSize: type.heading,
    letterSpacing: -0.5,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    color: colors.text,
  },
  postStrip: {
    paddingLeft: spacing.lg,
    paddingVertical: spacing.md,
  },
  postCard: {
    marginRight: spacing.md,
    gap: spacing.xs,
  },
  postImage: {
    height: 120,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  postAuthor: {
    fontWeight: '600',
    fontSize: type.label,
    color: colors.text,
  },
  postRating: {
    fontWeight: '600',
    fontSize: type.small,
    color: colors.textMuted,
  },
  postText: {
    fontSize: type.label,
    lineHeight: 18,
    color: colors.text,
  },
  emptyText: {
    fontSize: type.body,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
  },
});
