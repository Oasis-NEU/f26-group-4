import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, radius, spacing, type } from '@/theme';

import type { Profile } from '@/types/profile';

// Shows who this profile belongs to: picture, name, username, and where
// they live vs. where they're currently traveling. Shows an "Edit profile"
// button only when the person viewing it is looking at their own profile.

type ProfileHeaderProps = {
  profile: Profile; // the profile data to display
  isOwnProfile?: boolean; // true if the logged-in user is viewing their own profile
  onEditPress?: () => void; // called when "Edit profile" is tapped
};

export function ProfileHeader({ profile, isOwnProfile, onEditPress }: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.username}>@{profile.username}</Text>

      {/* TODO: turn currentCountry into an actual flag emoji once we know how
          (needs a country name/code -> emoji lookup); showing the country name for now */}
      <Text>Lives in {profile.homeCountry}</Text>
      <Text>Currently in {profile.currentCountry}</Text>

      {isOwnProfile && (
        <Pressable onPress={onEditPress} style={styles.editButton}>
          <Text>Edit profile</Text>
        </Pressable>
      )}
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
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: -0.6,
    color: colors.text,
  },
  username: {
    fontSize: type.label,
    color: colors.textMuted,
  },
  editButton: {
    // Was an outlined button. Nothing in this design system is outlined -- the
    // pale blue fill is what makes it read as a button.
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.round,
    backgroundColor: colors.secondaryFill,
  },
});
