import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { useFollowerIds } from '@/hooks/use-follows';
import { useProfilesByIds } from '@/hooks/use-profiles';
import { useUserId } from '@/hooks/use-session';
import { useSettings, useToggleCloseFriend } from '@/hooks/use-settings';
import type { Profile } from '@/types/profile';

const NO_IDS: string[] = [];
const NO_PROFILES: Profile[] = [];

export default function CloseFriendsScreen() {
  const userId = useUserId();
  const followerIds = useFollowerIds(userId);
  const followers = useProfilesByIds(followerIds.data ?? NO_IDS);
  const settings = useSettings();
  // Adding or removing shows straight away and flips back if saving fails.
  const toggleCloseFriend = useToggleCloseFriend();
  const [query, setQuery] = useState('');

  const closeFriendIds = settings.data?.closeFriendIds ?? NO_IDS;

  function toggle(friendId: string) {
    toggleCloseFriend.mutate({ friendId, add: !closeFriendIds.includes(friendId) });
  }

  const visibleFollowers = (followers.data ?? NO_PROFILES).filter((follower) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return follower.name.toLowerCase().includes(q) || follower.username.toLowerCase().includes(q);
  });

  return (
    <View style={styles.screen}>
      <Text style={styles.note}>Nobody else can see this list, not even the people on it.</Text>

      <TextInput style={styles.search} placeholder="Search your followers" value={query} onChangeText={setQuery} />

      <FlatList
        data={visibleFollowers}
        keyExtractor={(follower) => follower.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No followers match &quot;{query}&quot;.</Text>}
        renderItem={({ item }) => {
          const isCloseFriend = closeFriendIds.includes(item.id);
          return (
            <View style={styles.row}>
              <Avatar name={item.name} username={item.username} uri={item.profilePicture} userId={item.id} avatarHue={item.avatarHue} size={44} />
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              <Pressable
                style={[styles.toggleButton, isCloseFriend && styles.toggleButtonActive]}
                onPress={() => toggle(item.id)}
              >
                <Text style={[styles.toggleText, isCloseFriend && styles.toggleTextActive]}>
                  {isCloseFriend ? '✓ Close friend' : '+ Add'}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  note: {
    fontSize: 12,
    color: '#888',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  search: {
    margin: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  empty: {
    color: 'gray',
    textAlign: 'center',
    paddingVertical: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
  },
  username: {
    color: 'gray',
    fontSize: 13,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  toggleButtonActive: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
});
