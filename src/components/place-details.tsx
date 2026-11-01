import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Place } from '@/types/place';
import { getCountryFlag } from '@/utils/country-flags';

// Shows everything about one place. The screen (src/app/place/[id].tsx) finds the
// place and hands it here; this component only displays what it's given.

type PlaceDetailsProps = {
  place: Place;
};

export function PlaceDetails({ place }: PlaceDetailsProps) {
  // Whether the bookmark button looks filled in. Only remembered while the app is open.
  // TODO: once collections exist, this should check whether the place is actually saved,
  // and tapping it should open the "save to collection" sheet instead of just toggling.
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Some sizes depend on how big the phone is, so they have to be measured
  const window = useWindowDimensions();

  // The photo is about 35% of the screen height
  const coverHeight = window.height * 0.35;

  // I want 2.5 posts visible at once, so you can tell there are more to the right
  // The strip starts 16 from the left, and each post has a 12 gap after it
  const postWidth = (window.width - 16) / 2.5 - 12;

  // place.proximity is in meters. Anything over 1000 reads better in kilometers.
  // TODO: is there a way to have this automatically convert to user's preffered units?
  // maybe the user could even prefer to have it in minutes of walking instead of distance
  let distanceText = place.proximity + ' m away';
  if (place.proximity >= 1000) {
    distanceText = (place.proximity / 1000).toFixed(1) + ' km away';
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

  function handleBookmark() {
    setIsBookmarked(!isBookmarked);
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
    <ScrollView style={styles.page}>
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

          {/* TODO: this should open the Upload page with this place already filled in. */}
          <Pressable style={styles.overlayButton}>
            <Text style={styles.overlayButtonText}>Review</Text>
          </Pressable>
        </View>

        {/* How far away it is, in the bottom-left corner of the photo */}
        <View style={[styles.overlayButton, styles.distanceBadge]}>
          <Text style={styles.overlayButtonText}>{distanceText}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Name on the left, the three ratings on the right.
            `justifyContent: 'space-between'` is what pushes them apart. */}
        <View style={styles.titleRow}>
          <View style={styles.titleArea}>
            <Text style={styles.title}>{place.name}</Text>
            {place.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Friends' and "for you" are optional, so each one is checked first. */}
          {/* TODO: swap the ★ text for the shared RatingStars component once someone builds it. */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingNumber}>★ {place.averageRating.toFixed(1)}</Text>
              <Text style={styles.ratingLabel}>Average</Text>
            </View>

            {place.friendsRating !== undefined && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingNumber}>★ {place.friendsRating.toFixed(1)}</Text>
                <Text style={styles.ratingLabel}>Friends</Text>
              </View>
            )}

            {place.algorithmRating !== undefined && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingNumber}>★ {place.algorithmRating.toFixed(1)}</Text>
                <Text style={styles.ratingLabel}>For you</Text>
              </View>
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

        {/* One pill per tag. .map() turns the array of strings into a list of Views. */}
        <View style={styles.chipRow}>
          {place.suitedFor.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* The AI summary (using all of the reviews) Hidden when the place doesn't have one yet. */}
        {place.aiSummary !== undefined && (
          <>
            <Text style={styles.sectionHeading}>Summary</Text>
            <Text style={styles.summary}>{place.aiSummary}</Text>
            <Text style={styles.summaryNote}>Summarised from reviews</Text>
          </>
        )}
      </View>

      {/* Posts:
          Scrolls sideways with about 2.5 posts visible at a time. */}
      {/* NOTE: not using the shared MediaPost component, because it expects media to look
          like { imgURL, caption } and ours looks like { type, url, caption }. Needs a team fix. */}
      <Text style={styles.sectionHeadingWide}>Posts</Text>

      {/* place.reviews is optional, so `?? []` gives an empty list when there isn't one,
          which means .length and .map still work below. */}
      {(place.reviews ?? []).length === 0 ? (
        <Text style={styles.emptyText}>Be the first to post about this place.</Text>
      ) : (
        <ScrollView horizontal style={styles.postStrip} showsHorizontalScrollIndicator={false}>
          {(place.reviews ?? []).map((review) => (
            <View key={review.id} style={[styles.postCard, { width: postWidth }]}>
              {/* Every card gets a block, even posts with no photo, so they all line
                  up at the same height.
                  TODO: swap for <Image source={review.media[0].url} /> later. */}
              <View style={[styles.postImage, { width: postWidth }]}>
                <Text style={styles.placeholderLabel}>
                  {review.media.length > 0 ? 'Photo' : 'No photo'}
                </Text>
              </View>

              <Text style={styles.postAuthor}>{review.profileName}</Text>
              <Text style={styles.postRating}>★ {review.rating} / 5</Text>

              {/* numberOfLines cuts long reviews off with "..." so every card is
                  roughly the same height */}
              {review.reviewText !== undefined && (
                <Text style={styles.postText} numberOfLines={3}>
                  {review.reviewText}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  coverBlock: {
    width: '100%',
    backgroundColor: '#dcdcdc',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // lets the buttons sit on top using `position: absolute`
  },
  placeholderLabel: {
    fontSize: 13,
    color: '#8a8a8a',
  },
  // The squoval shape shared by every button sitting on the photo.
  overlayButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overlayButtonFilled: {
    backgroundColor: '#c8c8c8',
  },
  overlayButtonText: {
    fontSize: 13,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  topRightButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  body: {
    padding: 16,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleArea: {
    flex: 1, // takes the leftover space, so the name wraps instead of squashing the ratings
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start', // stops the badge stretching the full width
  },
  verifiedText: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  ratingLabel: {
    fontSize: 10,
    color: '#555555',
  },
  subtitle: {
    fontSize: 15,
    color: '#555555',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  link: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: 15,
    color: '#555555',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // tags move onto a second line instead of running off the edge
    gap: 8,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
  },
  summaryNote: {
    fontSize: 12,
    color: '#8a8a8a',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingTop: 8,
  },
  // Same as sectionHeading, but for the bits that sit outside the padded body.
  sectionHeadingWide: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  postStrip: {
    paddingLeft: 16,
    paddingVertical: 12,
  },
  postCard: {
    marginRight: 12,
    gap: 4,
  },
  postImage: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#dcdcdc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  postAuthor: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  postRating: {
    fontSize: 12,
    color: '#555555',
  },
  postText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 15,
    color: '#555555',
    paddingHorizontal: 16,
  },
});
