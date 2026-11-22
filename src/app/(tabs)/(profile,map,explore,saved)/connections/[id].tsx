import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/ui';
import { useFollowerIds, useFollowingIds } from '@/hooks/use-follows';
import { useProfilesByIds } from '@/hooks/use-profiles';
import { useUserId } from '@/hooks/use-session';
import { colors, spacing, type } from '@/theme';
import type { Profile } from '@/types/profile';

// Someone's followers/following, toggled with a pill tab bar, from either
// your own profile or someone else's -- opened from ProfileStats' Followers
// and Following numbers. Rows are the same avatar+username row as everywhere
// else in the app (FriendSuggestion, the follow-requests inbox); tapping one
// pushes to /user/[id], which already sends you to /profile by itself when
// that id turns out to be your own.

type ListKind = 'followers' | 'following';

const NO_IDS: string[] = [];
const NO_PROFILES: Profile[] = [];

export default function ConnectionsPage() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const myUserId = useUserId();
  const [activeTab, setActiveTab] = useState<ListKind>(tab === 'following' ? 'following' : 'followers');

  const followerIds = useFollowerIds(id);
  const followingIds = useFollowingIds(id);
  const activeIds = (activeTab === 'followers' ? followerIds.data : followingIds.data) ?? NO_IDS;
  const profiles = useProfilesByIds(activeIds);
  const isLoading =
    (activeTab === 'followers' ? followerIds.isPending : followingIds.isPending) ||
    profiles.isPending ||
    profiles.isPlaceholderData;

  // Same order as activeIds (follower/following order), not whatever order
  // useProfilesByIds' own request happens to return.
  const rows = activeIds
    .map((personId) => (profiles.data ?? NO_PROFILES).find((profile) => profile.id === personId))
    .filter((profile): profile is Profile => !!profile);

  // Getting out of here. The header's back arrow only appears when there's a
  // screen to go back TO (see collection/[id].tsx) -- a direct link or a
  // reload has none, so this falls back to the profile being looked at.
  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (id === myUserId) {
      router.replace('/profile');
    } else {
      router.replace({ pathname: '/user/[id]', params: { id } });
    }
  }

  const backButton = () => (
    <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
      <Icon name="back" size={24} />
    </Pressable>
  );

  function openProfile(personId: string) {
    router.push({ pathname: '/user/[id]', params: { id: personId } });
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: activeTab === 'followers' ? 'Followers' : 'Following', headerLeft: backButton }} />

      <View style={styles.tabBar}>
        {(['followers', 'following'] as const).map((kind) => (
          <Pressable
            key={kind}
            onPress={() => setActiveTab(kind)}
            style={[styles.tabButton, activeTab === kind && styles.tabButtonActive]}
          >
            <Text style={[styles.tabLabel, activeTab === kind && styles.tabLabelActive]}>
              {kind === 'followers' ? 'Followers' : 'Following'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(profile) => profile.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? undefined : (
            <Text style={styles.empty}>
              {activeTab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openProfile(item.id)}>
            <Avatar name={item.name} username={item.username} uri={item.profilePicture} userId={item.id} avatarHue={item.avatarHue} size={44} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
  list: {
    padding: spacing.lg,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: type.body,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: type.small,
    color: colors.textMuted,
  },
});
