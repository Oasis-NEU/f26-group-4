import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, radius, spacing, type } from '@/theme';

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
      <Avatar
        name={profile.name}
        username={profile.username}
        uri={profile.profilePicture}
        userId={profile.id}
        avatarHue={profile.avatarHue}
        size={56}
      />
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
    gap: spacing.xs,
    width: 90,
  },
  name: {
    fontSize: type.label,
    color: colors.text,
    textAlign: 'center',
  },
  reason: {
    fontSize: type.tiny,
    color: colors.textMuted,
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
