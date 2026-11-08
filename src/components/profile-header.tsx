import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatStatusText } from '@/utils/status-text';
import type { Profile, VisibleTravelStatus } from '@/types/profile';

// Shows who this profile belongs to: name, username, where they live, and
// their travel status (already privacy-trimmed by the caller -- see
// getVisibleStatus in services/users.ts). Shows "Edit profile" on your own
// profile, or "Follow"/"Following" + Share on someone else's.
// The avatar itself is rendered by the caller, overlapping ProfileCover --
// see ProfileCover's `avatar` prop.

type ProfileHeaderProps = {
  profile: Profile; // the profile data to display
  homeCity: { name: string; flag: string } | null; // resolved from profile.homeCityId by the caller (see cities.ts)
  visibleStatus: VisibleTravelStatus | null; // already trimmed for the current viewer
  isOwnProfile?: boolean; // true if the logged-in user is viewing their own profile
  isFollowing?: boolean; // only used when !isOwnProfile
  onEditPress?: () => void; // called when "Edit profile" is tapped
  onFollowPress?: () => void; // called when "Follow"/"Following" is tapped
  onSharePress?: () => void; // called when "Share" is tapped
  notifyBell?: ReactNode; // the NotifyBell, rendered next to Following when the caller has it ready
};

export function ProfileHeader({
  profile,
  homeCity,
  visibleStatus,
  isOwnProfile,
  isFollowing,
  onEditPress,
  onFollowPress,
  onSharePress,
  notifyBell,
}: ProfileHeaderProps) {
  const pill = formatStatusText(visibleStatus);

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.username}>@{profile.username}</Text>

      {homeCity && (
        <Text>
          Lives in {homeCity.name} {homeCity.flag}
        </Text>
      )}
      {pill && <Text style={styles.statusPill}>{pill}</Text>}

      {isOwnProfile ? (
        <Pressable onPress={onEditPress} style={[styles.secondaryButton, styles.standaloneButton]}>
          <Text>Edit profile</Text>
        </Pressable>
      ) : (
        <View style={styles.buttonRow}>
          <Pressable onPress={onFollowPress} style={isFollowing ? styles.secondaryButton : styles.primaryButton}>
            <Text style={isFollowing ? styles.secondaryButtonText : styles.primaryButtonText}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
          {isFollowing && notifyBell}
          <Pressable onPress={onSharePress} style={styles.secondaryButton}>
            <Text>Share</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  username: {
    color: 'gray',
  },
  statusPill: {
    marginTop: 4,
    fontSize: 13,
    color: '#444',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2A9D8F',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  standaloneButton: {
    marginTop: 8,
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
});
