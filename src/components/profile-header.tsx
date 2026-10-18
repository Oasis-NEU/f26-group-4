import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    fontSize: 20,
    fontWeight: 'bold',
  },
  username: {
    color: 'gray',
  },
  editButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
});
