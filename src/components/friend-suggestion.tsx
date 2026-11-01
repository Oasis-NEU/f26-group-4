import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Profile } from '@/types/profile';

// One suggested friend in the Profile page's horizontal "Suggested friends" row:
// an avatar, their name, and an Add button.

type FriendSuggestionProps = {
  profile: Profile; // the suggested person
  onAddPress?: () => void; // called when "Add" is tapped
};

export function FriendSuggestion({ profile, onAddPress }: FriendSuggestionProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
      <Text style={styles.name} numberOfLines={1}>
        {profile.name}
      </Text>
      <Pressable onPress={onAddPress} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  name: {
    fontSize: 13,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 12,
  },
});
