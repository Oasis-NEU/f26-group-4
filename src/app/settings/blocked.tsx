import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { useProfilesByIds } from '@/hooks/use-profiles';
import { useSettings, useUnblockUser } from '@/hooks/use-settings';
import type { Profile } from '@/types/profile';

const NO_IDS: string[] = [];
const NO_PROFILES: Profile[] = [];

export default function BlockedScreen() {
  const settings = useSettings();
  const blockedIds = settings.data?.blockedIds ?? NO_IDS;
  const profiles = useProfilesByIds(blockedIds);
  const unblock = useUnblockUser();

  // Unblocking takes someone out of blockedIds straight away, so they drop off
  // here before the list reloads.
  const blocked = (profiles.data ?? NO_PROFILES).filter((profile) => blockedIds.includes(profile.id));
  const isLoading = settings.isPending || profiles.isPending || profiles.isPlaceholderData;

  return (
    <View style={styles.screen}>
      <FlatList
        data={blocked}
        keyExtractor={(profile) => profile.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={isLoading ? undefined : <Text style={styles.empty}>You haven&apos;t blocked anyone.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar name={item.name} username={item.username} uri={item.profilePicture} userId={item.id} avatarHue={item.avatarHue} size={44} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
            <Pressable style={styles.unblockButton} onPress={() => unblock.mutate(item.id)}>
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
