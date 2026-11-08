import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { CollectionCard } from '@/components/collection-card';
import { FollowRequestsSheet, type FollowRequestItem } from '@/components/follow-requests-sheet';
import { FriendSuggestion } from '@/components/friend-suggestion';
import { PlacesMap, WORLD_CAMERA } from '@/components/places-map';
import { ProfileBadges } from '@/components/profile-badges';
import { ProfileChecklist, type ChecklistInput } from '@/components/profile-checklist';
import { AVATAR_OVERLAP, hasVisibleCover, ProfileCover } from '@/components/profile-cover';
import { ProfileHeader } from '@/components/profile-header';
import { ProfileInterests } from '@/components/profile-interests';
import { ProfilePosts, type ProfilePostSummary } from '@/components/profile-posts';
import { ProfileSkeleton } from '@/components/profile-skeleton';
import { ProfileStats } from '@/components/profile-stats';
// THEME CODE -- design system. See profile-header.tsx for the convention.
import { colors, radius, spacing, type } from '@/theme';
import { getProfileCity } from '@/services/profile-cities';
import { getCollectionsForProfile } from '@/services/collections';
import {
  acceptFollowRequest,
  declineFollowRequest,
  followUser,
  getFollowerIds,
  getFollowingIds,
  getFollowRequests,
} from '@/services/follows';
import { getInterestsByIds } from '@/services/interests';
import { getPlace } from '@/services/places';
import { getReviewsByAuthor, type AuthoredReview } from '@/services/reviews';
import { useUserId } from '@/hooks/use-session';
import { getProfile, getSuggestedFriends, type SuggestedFriend } from '@/services/users';
import { getCountryFlag } from '@/utils/country-flags';
import type { Collection } from '@/types/collection';
import type { Place } from '@/types/place';
import type { Profile, VisibleTravelStatus } from '@/types/profile';

// Profile tab: the signed-in user's own profile.

type ProfileTab = 'collections' | 'map' | 'badges';

type ProfileData = {
  profile: Profile | null;
  homeCity: { name: string; flag: string } | null; // resolved from profile.homeCityId
  dreamTripName?: string; // resolved from profile.dreamTripCityId
  interestNames: string[]; // resolved from profile.interestIds
  visibleStatus: VisibleTravelStatus | null;
  followerCount: number;
  followingCount: number;
  reviews: AuthoredReview[];
  suggestedFriends: SuggestedFriend[];
  followRequests: FollowRequestItem[];
  collections: Collection[];
  places: Place[];
};

// Everything this screen needs, fetched together. Kept outside the component
// so useFocusEffect can call it without re-creating it every render.
// Suggestion reasons, requesters' details and the trimmed status all come
// from the database now, so there's no second round of lookups for them.
async function loadProfileData(viewerId: string): Promise<ProfileData> {
  const [fetchedProfile, followers, following, authoredReviews, suggestedFriends, followRequests, fetchedCollections] =
    await Promise.all([
      getProfile(viewerId),
      getFollowerIds(viewerId),
      getFollowingIds(viewerId),
      getReviewsByAuthor(viewerId),
      getSuggestedFriends(),
      getFollowRequests(),
      getCollectionsForProfile(viewerId),
    ]);

  if (!fetchedProfile) {
    return {
      profile: null,
      homeCity: null,
      interestNames: [],
      visibleStatus: null,
      followerCount: followers.length,
      followingCount: following.length,
      reviews: authoredReviews,
      suggestedFriends: [],
      followRequests: [],
      collections: fetchedCollections,
      places: [],
    };
  }

  // These only need the profile and reviews fetched above, so they run as one batch.
  const [places, homeCityRecord, dreamTripRecord, interests] = await Promise.all([
    Promise.all(authoredReviews.map((review) => getPlace(review.placeID))).then((items) =>
      items.filter((place): place is Place => place !== null),
    ),
    fetchedProfile.homeCityId ? getProfileCity(fetchedProfile.homeCityId) : Promise.resolve(null),
    fetchedProfile.dreamTripCityId ? getProfileCity(fetchedProfile.dreamTripCityId) : Promise.resolve(null),
    getInterestsByIds(fetchedProfile.interestIds),
  ]);

  return {
    profile: fetchedProfile,
    homeCity: homeCityRecord ? { name: homeCityRecord.name, flag: getCountryFlag(homeCityRecord.country) } : null,
    dreamTripName: dreamTripRecord?.name,
    interestNames: interests.map((interest) => interest.name),
    // Already trimmed by the database for whoever is looking; yours comes back in full.
    visibleStatus: fetchedProfile.visibleStatus ?? null,
    followerCount: followers.length,
    followingCount: following.length,
    reviews: authoredReviews,
    suggestedFriends,
    followRequests,
    collections: fetchedCollections,
    places,
  };
}

export default function ProfilePage() {
  const userId = useUserId();
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('collections');

  const refresh = useCallback(async () => {
    const fresh = await loadProfileData(userId);
    setData(fresh);
  }, [userId]);

  // Refetch whenever the tab comes back into focus, e.g. after closing the edit modal.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      setIsLoading(true);
      loadProfileData(userId)
        .then((fresh) => {
          if (!isActive) return;
          setData(fresh);
        })
        .finally(() => isActive && setIsLoading(false));

      return () => {
        isActive = false;
      };
    }, [userId]),
  );

  if (isLoading || !data?.profile) {
    return <ProfileSkeleton />;
  }

  const {
    profile,
    homeCity,
    dreamTripName,
    interestNames,
    visibleStatus,
    followerCount,
    followingCount,
    reviews,
    suggestedFriends,
    followRequests,
    collections,
    places,
  } = data;

  const showsCover = hasVisibleCover(profile.coverMode, profile.coverImage, visibleStatus, dreamTripName);

  const postSummaries: ProfilePostSummary[] = reviews.map((review) => ({
    id: review.id,
    placeName: review.placeName,
    rating: review.rating,
    thumbnail: review.media[0]?.url || undefined,
  }));

  const checklistInput: ChecklistInput = {
    hasProfilePhoto: !!profile.profilePicture,
    hasBio: !!profile.bio,
    postsCount: reviews.length,
    followingCount,
  };

  function openPlace(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ProfileCover
          coverMode={profile.coverMode}
          coverImage={profile.coverImage}
          visibleStatus={visibleStatus}
          dreamTrip={dreamTripName}
          isOwnProfile
          pendingRequestCount={followRequests.length}
          avatar={
            <Avatar
              name={profile.name}
              username={profile.username}
              uri={profile.profilePicture}
              userId={profile.id}
              avatarHue={profile.avatarHue}
              size={96}
            />
          }
          onSettingsPress={() => router.push('/settings')}
          onInboxPress={() => setIsInboxOpen(true)}
        />

        <View style={[styles.content, showsCover && styles.contentWithCover]}>
          <ProfileHeader
            profile={profile}
            homeCity={homeCity}
            visibleStatus={visibleStatus}
            isOwnProfile
            onEditPress={() => router.push('/edit-profile')}
          />

          <ProfileStats placesCount={reviews.length} followersCount={followerCount} followingCount={followingCount} />

          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <ProfileInterests interests={interestNames} />

          <ProfileChecklist input={checklistInput} />

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Places I&apos;ve been</Text>
              {/* TODO: no full-grid "see all" screen yet -- this row is the only view for now. */}
            </View>
            {postSummaries.length > 0 ? (
              <ProfilePosts posts={postSummaries} variant="horizontal" onPostPress={openPlace} />
            ) : (
              <Text style={styles.message}>You haven&apos;t reviewed anywhere yet.</Text>
            )}
          </View>

          {suggestedFriends.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggested friends</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsRow}>
                {suggestedFriends.map(({ profile: friend, reason }) => (
                  <FriendSuggestion
                    key={friend.id}
                    profile={friend}
                    reason={reason}
                    // Follows them, or sends a request if their account is friends-only.
                    onAddPress={() => followUser(friend.id).then(refresh)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.tabBar}>
            {(['collections', 'map', 'badges'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              >
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                  {tab === 'collections' ? 'Collections' : tab === 'map' ? 'Map' : 'Badges'}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === 'collections' &&
            (collections.length > 0 ? (
              <View style={styles.collectionsList}>
                {collections.map((collection, index) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    index={index}
                    onPress={() => router.push({ pathname: '/collection/[id]', params: { id: collection.id } })}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.message}>No collections yet.</Text>
            ))}

          {activeTab === 'map' && (
            <View style={styles.mapTab}>
              {places.length > 0 ? (
                <PlacesMap places={places} camera={WORLD_CAMERA} onSelectPlace={() => {}} onViewDetails={openPlace} />
              ) : (
                <Text style={styles.message}>No places on the map yet.</Text>
              )}
            </View>
          )}

          {activeTab === 'badges' && <ProfileBadges reviews={reviews} goals={profile.goals} />}

        </View>
      </ScrollView>

      <FollowRequestsSheet
        visible={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        requests={followRequests}
        onAccept={(fromId) => {
          acceptFollowRequest(fromId).then(refresh);
        }}
        onDecline={(fromId) => {
          declineFollowRequest(fromId).then(refresh);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  // Only when ProfileCover actually shows a band: extra top space so the
  // avatar overlapping its bottom edge (see AVATAR_OVERLAP) doesn't sit on
  // top of the name/username. No-cover profiles don't need this -- the
  // avatar there is laid out inline by ProfileCover itself, not overlapping.
  contentWithCover: {
    paddingTop: spacing.xl + AVATAR_OVERLAP,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: type.title,
    fontWeight: 'bold',
    color: colors.text,
  },
  bio: {
    fontSize: type.body,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: type.body,
    color: colors.textMuted,
  },
  friendsRow: {
    flexDirection: 'row',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.ink,
  },
  tabLabel: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.text,
  },
  collectionsList: {
    gap: spacing.md,
  },
  mapTab: {
    height: 360,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
});
