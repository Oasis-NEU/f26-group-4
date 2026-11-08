import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { getFollowerIds } from '@/services/follows';
import { addCloseFriend, getSettings, removeCloseFriend } from '@/services/settings';
import { useUserId } from '@/hooks/use-session';
import { getProfile } from '@/services/users';
import type { Profile } from '@/types/profile';

export default function CloseFriendsScreen() {
  const userId = useUserId();
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [closeFriendIds, setCloseFriendIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      Promise.all([getFollowerIds(userId), getSettings()]).then(async ([followerIds, settings]) => {
        const profiles = (await Promise.all(followerIds.map((id) => getProfile(id)))).filter(
          (profile): profile is Profile => profile !== null,
        );
        if (!isActive) return;
        setFollowers(profiles);
        setCloseFriendIds(settings.closeFriendIds);
      });
      return () => {
        isActive = false;
      };
    }, [userId]),
  );

  async function toggle(friendId: string) {
    const isCloseFriend = closeFriendIds.includes(friendId);
    setCloseFriendIds((current) => (isCloseFriend ? current.filter((id) => id !== friendId) : [...current, friendId]));
    if (isCloseFriend) {
      await removeCloseFriend(friendId);
    } else {
      await addCloseFriend(friendId);
    }
  }

  const visibleFollowers = followers.filter((follower) => {
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
