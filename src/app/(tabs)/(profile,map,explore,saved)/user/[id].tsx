import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { CollectionCard } from '@/components/collection-card';
import { ConfirmModal } from '@/components/confirm-modal';
import { NotifyBell } from '@/components/notify-bell';
import { PlacesMap, WORLD_CAMERA } from '@/components/places-map';
import { ProfileBadges } from '@/components/profile-badges';
import { AVATAR_OVERLAP, hasVisibleCover, ProfileCover } from '@/components/profile-cover';
import { ProfileHeader } from '@/components/profile-header';
import { ProfileInterests } from '@/components/profile-interests';
import { ProfilePosts, type ProfilePostSummary } from '@/components/profile-posts';
import { ProfileSkeleton } from '@/components/profile-skeleton';
import { ProfileStats } from '@/components/profile-stats';
import { colors, radius, spacing, type } from '@/theme';
import { useBlockUser } from '@/hooks/use-settings';
import { useProfileCity } from '@/hooks/use-cities';
import { useCollectionsForProfile } from '@/hooks/use-collections';
import { useFollow, useFollowerIds, useFollowingIds, useFollowStatus, useSetNotifyPrefs, useUnfollow } from '@/hooks/use-follows';
import { useInterestsByIds } from '@/hooks/use-interests';
import { usePlacesByIds } from '@/hooks/use-places';
import { useProfile } from '@/hooks/use-profiles';
import { useReviewsByUser } from '@/hooks/use-reviews';
import { useUserId } from '@/hooks/use-session';
import { getCountryFlag } from '@/utils/country-flags';

// Someone else's profile: the same layout as the Profile tab, but read-only
// data (their reviews, their collections) and the Follow/Share header instead
// of Edit profile. Opened by tapping an avatar (Suggested friends, the
// follow-requests inbox, etc.) -- see FriendSuggestion and FollowRequestsSheet.

type ProfileTab = 'collections' | 'map' | 'badges';

const NO_IDS: string[] = [];

// router.back() only works if there's a screen to go back TO -- a direct link
// (a refreshed browser tab) has no history, so this falls back to Profile.
function backToProfile() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/profile');
  }
}

export default function UserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const myUserId = useUserId();
  const [activeTab, setActiveTab] = useState<ProfileTab>('collections');
  const [isBlockOpen, setIsBlockOpen] = useState(false);

  // Your own avatar (e.g. in a list of followers) opens the real Profile tab
  // instead of a read-only copy of the same thing.
  useEffect(() => {
    if (id && id === myUserId) {
      router.replace('/profile');
    }
  }, [id, myUserId]);

  const profileQuery = useProfile(id);
  const followersQuery = useFollowerIds(id);
  const followingQuery = useFollowingIds(id);
  const followStatusQuery = useFollowStatus(id);
  const reviewsQuery = useReviewsByUser(id);
  const collectionsQuery = useCollectionsForProfile(id);

  const profile = profileQuery.data;
  const reviews = reviewsQuery.data ?? [];
  const placesQuery = usePlacesByIds(reviews.map((review) => review.placeID));
  const homeCityQuery = useProfileCity(profile?.homeCityId);
  const dreamTripQuery = useProfileCity(profile?.dreamTripCityId);
  const interestsQuery = useInterestsByIds(profile?.interestIds ?? NO_IDS);

  const follow = useFollow();
  const unfollow = useUnfollow();
  const setNotifyPrefs = useSetNotifyPrefs();
  const blockUser = useBlockUser();

  if (id === myUserId) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.isError || (profileQuery.isSuccess && !profile)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Pressable onPress={backToProfile} hitSlop={8}>
          <Text style={styles.backLink}>‹ Back</Text>
        </Pressable>
        <Text style={styles.message}>This profile isn&apos;t available.</Text>
      </SafeAreaView>
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
  const visibleStatus = profile.visibleStatus ?? null;
  const followerCount = followersQuery.data?.length ?? 0;
  const followingCount = followingQuery.data?.length ?? 0;
  const collections = collectionsQuery.data ?? [];
  const places = placesQuery.data ?? [];
  const followState = followStatusQuery.data?.state ?? 'none';

  const showsCover = hasVisibleCover(profile.coverMode, profile.coverImage, visibleStatus, dreamTripName);

  const postSummaries: ProfilePostSummary[] = reviews.map((review) => ({
    id: review.id,
    placeName: review.placeName,
    rating: review.rating,
    thumbnail: review.media[0]?.url || undefined,
  }));

  function openPlace(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } });
  }

  // Tapping Follow sends a follow (or a request, for a friends-only account);
  // tapping it again while Following or Requested cancels either one -- same
  // "stop following" action either way, from unfollowUser's point of view.
  // profile is non-null here (the early returns above guarantee it), but TS
  // doesn't carry that narrowing into these nested function declarations.
  function toggleFollow() {
    if (followState === 'none') {
      follow.mutate(profile!.id);
    } else {
      unfollow.mutate(profile!.id);
    }
  }

  function sharePress() {
    Share.share({ message: `Check out @${profile!.username} on Oasis` });
  }

  function confirmBlock() {
    setIsBlockOpen(false);
    blockUser.mutate(profile!.id);
    backToProfile();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ProfileCover
          coverMode={profile.coverMode}
          coverImage={profile.coverImage}
          visibleStatus={visibleStatus}
          dreamTrip={dreamTripName}
          dreamTripCityId={profile.dreamTripCityId}
          isOwnProfile={false}
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
          onBackPress={backToProfile}
          onMenuPress={() => setIsBlockOpen(true)}
        />

        <View style={[styles.content, showsCover && styles.contentWithCover]}>
          <ProfileHeader
            profile={profile}
            homeCity={homeCity}
            visibleStatus={visibleStatus}
            isOwnProfile={false}
            followState={followState}
            onFollowPress={toggleFollow}
            onSharePress={sharePress}
            notifyBell={
              <NotifyBell
                name={profile.name}
                notifyPosts={followStatusQuery.data?.notifyPosts ?? false}
                notifyStatus={followStatusQuery.data?.notifyStatus ?? false}
                canSeeStatusUpdates={!!visibleStatus}
                onChange={(prefs) => setNotifyPrefs.mutate({ userId: profile.id, ...prefs })}
              />
            }
          />

          <ProfileStats
            placesCount={reviews.length}
            followersCount={followerCount}
            followingCount={followingCount}
            onPressFollowers={() => router.push({ pathname: '/connections/[id]', params: { id: profile.id, tab: 'followers' } })}
            onPressFollowing={() => router.push({ pathname: '/connections/[id]', params: { id: profile.id, tab: 'following' } })}
          />

          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <ProfileInterests interests={interestNames} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Places they&apos;ve been</Text>
            {postSummaries.length > 0 ? (
              <ProfilePosts posts={postSummaries} variant="horizontal" onPostPress={openPlace} />
            ) : (
              <Text style={styles.message}>No reviews yet.</Text>
            )}
          </View>

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
                    compact={collections.length > 4}
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

          {activeTab === 'badges' && <ProfileBadges reviews={reviews} goals={profile.goals} profileId={profile.id} isOwnProfile={false} />}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={isBlockOpen}
        title={`Block @${profile.username}?`}
        message="They won't be able to follow you or see your profile. You can undo this later from Settings."
        confirmLabel="Block"
        destructive
        onConfirm={confirmBlock}
        onCancel={() => setIsBlockOpen(false)}
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
  contentWithCover: {
    paddingTop: spacing.xl + AVATAR_OVERLAP,
  },
  section: {
    gap: spacing.sm,
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
  backLink: {
    fontSize: type.body,
    color: colors.link,
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
