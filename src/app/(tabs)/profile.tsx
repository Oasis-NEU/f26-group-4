import { useCallback, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FriendSuggestion } from '@/components/friend-suggestion';
import { ProfileHeader } from '@/components/profile-header';
import { ProfileInterests } from '@/components/profile-interests';
import { getProfile, getSuggestedFriends } from '@/services/users';
import type { Profile } from '@/types/profile';

// Profile tab: the logged-in user's own profile.
// There's no auth/session yet, so which profile is "mine" is hardcoded here.
// Swap this for the real signed-in user's id once a session exists.
const CURRENT_USER_ID = 'u1';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [suggestedFriends, setSuggestedFriends] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refetch whenever the tab comes back into focus, e.g. after closing the edit modal.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      setIsLoading(true);
      Promise.all([getProfile(CURRENT_USER_ID), getSuggestedFriends(CURRENT_USER_ID)]).then(
        ([fetchedProfile, friends]) => {
          if (!isActive) return;
          setProfile(fetchedProfile);
          setSuggestedFriends(friends);
          setIsLoading(false);
        },
      );

      return () => {
        isActive = false;
      };
    }, []),
  );

  if (isLoading || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProfileHeader profile={profile} isOwnProfile />

      <ProfileInterests interests={profile.interests} />

      {/* TODO(reviews): wire up once Review has an authorId and users.ts
          (or a new reviews service) exposes getReviewsByUser. For now every
          profile shows the empty state. */}
      <Text style={styles.sectionTitle}>Reviews</Text>
      <Text style={styles.message}>You haven&apos;t reviewed anywhere yet.</Text>

      {suggestedFriends.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Suggested friends</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsRow}>
            {suggestedFriends.map((friend) => (
              <FriendSuggestion key={friend.id} profile={friend} />
            ))}
          </ScrollView>
        </>
      )}

      {/* Temporary, so demo users can be switched until a real login gate exists. */}
      <Link href="/login" style={styles.link}>
        Log out
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
  },
  friendsRow: {
    flexDirection: 'row',
  },
  link: {
    marginTop: 20,
    color: '#0066CC',
    fontSize: 16,
  },
  skeletonAvatar: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ddd',
  },
  skeletonLine: {
    marginTop: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  skeletonLineShort: {
    width: '50%',
    alignSelf: 'center',
  },
});
