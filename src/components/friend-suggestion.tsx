import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import type { Profile } from '@/types/profile';

// One suggested friend in the Profile page's horizontal "Suggested friends" row:
// an avatar, their name, a reason line (e.g. "4 mutuals", "Also in Lisbon"),
// and an Add button.

type FriendSuggestionProps = {
  profile: Profile; // the suggested person
  reason?: string; // why they're suggested, e.g. "4 mutuals"
  onAddPress?: () => void; // called when "Add" is tapped
};

export function FriendSuggestion({ profile, reason, onAddPress }: FriendSuggestionProps) {
  return (
    <View style={styles.container}>
      <Avatar name={profile.name} photoUrl={profile.profilePicture} size={56} />
      <Text style={styles.name} numberOfLines={1}>
        {profile.name}
      </Text>
      {reason && (
        <Text style={styles.reason} numberOfLines={1}>
          {reason}
        </Text>
      )}
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
    width: 90,
  },
  name: {
    fontSize: 13,
    textAlign: 'center',
  },
  reason: {
    fontSize: 11,
    color: 'gray',
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
