import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, radius, spacing, type } from '@/theme';

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

// ---------------------------------------------------------------------------
// THEME CODE (design system) -- Ruby
//
// Colours, corner radius and spacing now come from src/theme.ts instead of
// being typed in here. These are LOOKS ONLY -- no logic changed, nothing moved,
// no props changed. Anything marked THEME CODE is safe to ignore while you work.
//
// To change a colour, change it in src/theme.ts so every screen updates, rather
// than putting a hex code back in here.
// ---------------------------------------------------------------------------
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
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    backgroundColor: colors.secondaryFill,
  },
  addButtonText: {
    fontWeight: '600',
    fontSize: type.small,
    color: colors.secondaryText,
  },
});
