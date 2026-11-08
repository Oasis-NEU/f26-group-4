import { useCallback, useState } from 'react';
import { Link, router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { CollectionCard } from '@/components/collection-card';
import { FollowRequestsSheet, type FollowRequestItem } from '@/components/follow-requests-sheet';
// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors } from '@/theme';

import { FriendSuggestion } from '@/components/friend-suggestion';
import { PlacesMap, WORLD_CAMERA } from '@/components/places-map';
import { ProfileBadges } from '@/components/profile-badges';
import { ProfileChecklist, type ChecklistInput } from '@/components/profile-checklist';
import { AVATAR_OVERLAP, hasVisibleCover, ProfileCover } from '@/components/profile-cover';
import { ProfileHeader } from '@/components/profile-header';
import { ProfileInterests } from '@/components/profile-interests';
import { ProfilePosts, type ProfilePostSummary } from '@/components/profile-posts';
import { ProfileStats } from '@/components/profile-stats';
import { getProfileCity } from '@/services/profile-cities';
import { getCollectionsForProfile } from '@/services/collections';
import {
  acceptFollowRequest,
  declineFollowRequest,
  getFollowerIds,
  getFollowingIds,
  getFollowRequests,
} from '@/services/follows';
import { getInterestsByIds } from '@/services/interests';
import { getPlace } from '@/services/places';
import { getReviewsByAuthor, type AuthoredReview } from '@/services/reviews';
import { getSettings } from '@/services/settings';
import { getProfile, getSuggestedFriends, getSuggestionReason, getVisibleStatus } from '@/services/users';
import { getCountryFlag } from '@/utils/country-flags';
import type { Collection } from '@/types/collection';
import type { Place } from '@/types/place';
import type { Profile, VisibleTravelStatus } from '@/types/profile';

// Profile tab: the logged-in user's own profile.
// There's no auth/session yet, so which profile is "mine" is hardcoded here.
// Swap this for the real signed-in user's id once a session exists.
const CURRENT_USER_ID = 'u1';

type SuggestedFriend = { profile: Profile; reason?: string };
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
async function loadProfileData(viewerId: string): Promise<ProfileData> {
  const [fetchedProfile, followers, following, authoredReviews, friends, requests, fetchedCollections] =
    await Promise.all([
      getProfile(viewerId),
      getFollowerIds(viewerId),
      getFollowingIds(viewerId),
      getReviewsByAuthor(viewerId),
      getSuggestedFriends(viewerId),
      getFollowRequests(viewerId),
      getCollectionsForProfile(viewerId, viewerId),
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

  const suggestedFriends = await Promise.all(
    friends.map(async (friend) => ({ profile: friend, reason: await getSuggestionReason(viewerId, friend) })),
  );

  const followRequests = (
    await Promise.all(
      requests.map(async (request): Promise<FollowRequestItem | null> => {
        const requester = await getProfile(request.fromId);
        if (!requester) return null;
        return {
          fromId: request.fromId,
          name: requester.name,
          username: requester.username,
          photoUrl: requester.profilePicture,
          avatarHue: requester.avatarHue,
          reason: await getSuggestionReason(viewerId, requester),
        };
      }),
    )
  ).filter((item): item is FollowRequestItem => item !== null);

  const places = (await Promise.all(authoredReviews.map((review) => getPlace(review.placeID)))).filter(
    (place): place is Place => place !== null,
  );

  const [homeCityRecord, dreamTripRecord, interests, mySettings] = await Promise.all([
    getProfileCity(fetchedProfile.homeCityId),
    fetchedProfile.dreamTripCityId ? getProfileCity(fetchedProfile.dreamTripCityId) : Promise.resolve(null),
    getInterestsByIds(fetchedProfile.interestIds),
    getSettings(viewerId),
  ]);

  return {
    profile: fetchedProfile,
    homeCity: homeCityRecord ? { name: homeCityRecord.name, flag: getCountryFlag(homeCityRecord.country) } : null,
    dreamTripName: dreamTripRecord?.name,
    interestNames: interests.map((interest) => interest.name),
    // Viewing your own profile always returns the full status (getVisibleStatus
    // short-circuits on viewerId === profile.id), so closeFriendIds doesn't
    // actually change the result here -- passed through for when this same
    // loading logic is reused for someone else's profile later.
    visibleStatus: getVisibleStatus(fetchedProfile, viewerId, mySettings.closeFriendIds),
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
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('collections');

  const refresh = useCallback(async () => {
    const fresh = await loadProfileData(CURRENT_USER_ID);
    setData(fresh);
  }, []);

  // Refetch whenever the tab comes back into focus, e.g. after closing the edit modal.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      setIsLoading(true);
      loadProfileData(CURRENT_USER_ID).then((fresh) => {
        if (!isActive) return;
        setData(fresh);
        setIsLoading(false);
      });

      return () => {
        isActive = false;
      };
    }, []),
  );

  if (isLoading || !data?.profile) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
      </View>
    );
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
                  <FriendSuggestion key={friend.id} profile={friend} reason={reason} />
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
              <View style={styles.collectionsGrid}>
                {collections.map((collection) => (
                  <View key={collection.id} style={styles.collectionItem}>
                    <CollectionCard
                      collection={collection}
                      onPress={() => router.push({ pathname: '/collection/[id]', params: { id: collection.id } })}
                    />
                  </View>
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

          {/* Temporary, so demo users can be switched until a real login gate exists. */}
          <Link href="/login" style={styles.link}>
            Log out
          </Link>
        </View>
      </ScrollView>

      <FollowRequestsSheet
        visible={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        requests={followRequests}
        onAccept={(fromId) => {
          acceptFollowRequest(CURRENT_USER_ID, fromId).then(refresh);
        }}
        onDecline={(fromId) => {
          declineFollowRequest(CURRENT_USER_ID, fromId).then(refresh);
        }}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// THEME CODE (design system) -- Ruby
//
// Colours, corner radius and spacing now come from src/theme.ts instead of
// being typed in here. These are LOOKS ONLY -- no logic changed, nothing moved,
// no props changed. Anything marked THEME CODE is safe to ignore while you work.
//
// To change a colour, change it in src/theme.ts so every screen updates, rather
// than putting a hex code back in here.
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    padding: 24,
    gap: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 24,
    gap: 16,
  },
  // Only when ProfileCover actually shows a band: extra top space so the
  // avatar overlapping its bottom edge (see AVATAR_OVERLAP) doesn't sit on
  // top of the name/username. No-cover profiles don't need this -- the
  // avatar there is laid out inline by ProfileCover itself, not overlapping.
  contentWithCover: {
    paddingTop: 24 + AVATAR_OVERLAP,
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bio: {
    fontSize: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'gray',
  },
  friendsRow: {
    flexDirection: 'row',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2A9D8F',
  },
  tabLabel: {
    color: 'gray',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#2A9D8F',
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  collectionItem: {
    width: '47%',
  },
  mapTab: {
    height: 360,
    borderRadius: 12,
    overflow: 'hidden',
  },
  link: {
    marginTop: 8,
    color: colors.link,
    fontSize: 16,
  },
  skeletonAvatar: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.fill,
  },
  skeletonLine: {
    marginTop: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.fill,
  },
  skeletonLineShort: {
    width: '50%',
    alignSelf: 'center',
  },
});
