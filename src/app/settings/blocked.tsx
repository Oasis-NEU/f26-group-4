import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { getSettings, unblockUser } from '@/services/settings';
import { getProfile } from '@/services/users';
import type { Profile } from '@/types/profile';

const CURRENT_USER_ID = 'u1';

export default function BlockedScreen() {
  const [blocked, setBlocked] = useState<Profile[]>([]);

  const load = useCallback(async () => {
    const settings = await getSettings(CURRENT_USER_ID);
    const profiles = (await Promise.all(settings.blockedIds.map((id) => getProfile(id)))).filter(
      (profile): profile is Profile => profile !== null,
    );
    setBlocked(profiles);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleUnblock(userId: string) {
    setBlocked((current) => current.filter((profile) => profile.id !== userId));
    await unblockUser(CURRENT_USER_ID, userId);
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={blocked}
        keyExtractor={(profile) => profile.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>You haven&apos;t blocked anyone.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar name={item.name} username={item.username} uri={item.profilePicture} userId={item.id} avatarHue={item.avatarHue} size={44} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
            <Pressable style={styles.unblockButton} onPress={() => handleUnblock(item.id)}>
              <Text style={styles.unblockText}>Unblock</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
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
  unblockButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  unblockText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
