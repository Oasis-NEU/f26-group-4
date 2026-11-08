import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { CollectionCard } from '@/components/collection-card';
import { FollowRequestsSheet } from '@/components/follow-requests-sheet';
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
import { useProfileCity } from '@/hooks/use-cities';
import { useCollectionsForProfile } from '@/hooks/use-collections';
import {
  useAcceptFollowRequest,
  useDeclineFollowRequest,
  useFollow,
  useFollowerIds,
  useFollowingIds,
  useFollowRequests,
  useSuggestedFriends,
} from '@/hooks/use-follows';
import { useInterestsByIds } from '@/hooks/use-interests';
import { usePlacesByIds } from '@/hooks/use-places';
import { useProfile } from '@/hooks/use-profiles';
import { useReviewsByUser } from '@/hooks/use-reviews';
import { useUserId } from '@/hooks/use-session';
import { getCountryFlag } from '@/utils/country-flags';

// Profile tab: the signed-in user's own profile.

type ProfileTab = 'collections' | 'map' | 'badges';

const NO_IDS: string[] = [];

export default function ProfilePage() {
  const userId = useUserId();
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('collections');

  // Each piece comes from the shared cache, so a change anywhere (editing your
  // profile, accepting a request, posting a review) refreshes it here by itself.
  // Suggestion reasons, requesters' details and the trimmed status all come
  // from the database, so there's no second round of lookups for them.
  const profileQuery = useProfile(userId);
  const followersQuery = useFollowerIds(userId);
  const followingQuery = useFollowingIds(userId);
  const reviewsQuery = useReviewsByUser(userId);
  const suggestionsQuery = useSuggestedFriends();
  const requestsQuery = useFollowRequests();
  const collectionsQuery = useCollectionsForProfile(userId);

  const profile = profileQuery.data;
  const reviews = reviewsQuery.data ?? [];
  // The places you've reviewed, for the Map tab, in one request.
  const placesQuery = usePlacesByIds(reviews.map((review) => review.placeID));
  const homeCityQuery = useProfileCity(profile?.homeCityId);
  const dreamTripQuery = useProfileCity(profile?.dreamTripCityId);
  const interestsQuery = useInterestsByIds(profile?.interestIds ?? NO_IDS);

  const follow = useFollow();
  const acceptRequest = useAcceptFollowRequest();
  const declineRequest = useDeclineFollowRequest();

  if (profileQuery.isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Couldn&apos;t load your profile.</Text>
      </View>
    );
  }

  if (profileQuery.isPending || !profile) {
    return <ProfileSkeleton />;
  }

  const homeCity = homeCityQuery.data
    ? { name: homeCityQuery.data.name, flag: getCountryFlag(homeCityQuery.data.country) }
    : null;
  const dreamTripName = dreamTripQuery.data?.name;
  const interestNames = (interestsQuery.data ?? []).map((interest) => interest.name);
  // Already trimmed by the database for whoever is looking; yours comes back in full.
  const visibleStatus = profile.visibleStatus ?? null;
  const followerCount = followersQuery.data?.length ?? 0;
  const followingCount = followingQuery.data?.length ?? 0;
  const suggestedFriends = suggestionsQuery.data ?? [];
  const followRequests = requestsQuery.data ?? [];
  const collections = collectionsQuery.data ?? [];
  const places = placesQuery.data ?? [];

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
                    onAddPress={() => follow.mutate(friend.id)}
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
          acceptRequest.mutate(fromId);
        }}
        onDecline={(fromId) => {
          declineRequest.mutate(fromId);
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
