import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, radius, spacing, type } from '@/theme';

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
  statusPill: {
    marginTop: spacing.xs,
    fontSize: type.small,
    color: colors.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  // The one filled-black button in this file -- "Follow" is the main action on
  // someone else's profile, and black-fill-with-white-text is how this design
  // system marks the primary action (see colors.textOnDark).
  primaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.round,
    backgroundColor: colors.ink,
  },
  primaryButtonText: {
    color: colors.textOnDark,
    fontWeight: '600',
  },
  // Pale blue fill, same treatment as every other secondary button ("Remove",
  // "Cancel") -- nothing in this design system is outlined.
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.round,
    backgroundColor: colors.secondaryFill,
  },
  standaloneButton: {
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.secondaryText,
    fontWeight: '600',
  },
});
