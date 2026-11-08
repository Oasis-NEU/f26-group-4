import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// The banner at the top of a profile. Three states, from `coverMode`:
// - 'custom': the photo the user picked (coverImage).
// - 'auto': which city to feature (traveling/planning city, or -- if home, or
//   the viewer can't see their city -- their dream trip) as a colored
//   placeholder, since there's no photo source for "a picture of Rome" yet.
// - 'none', or 'auto' with no city to show either way: no band at all. The
//   avatar sits at the top of the plain page instead of overlapping anything.
//
// `visibleStatus` must already be trimmed for the viewer (see getVisibleStatus
// in src/services/users.ts) -- this component never decides privacy, it only
// decides city vs. dream trip vs. nothing.
//
// `avatar` (the profile picture / initials circle) is passed in rather than
// built here, so this component doesn't need to know about Profile or Avatar
// directly -- it just positions whatever's handed to it.
//
// Settings (☰) + inbox are own-profile only. Back + ••• menu are for everyone else's.

// How far the avatar hangs below the cover into the content area when there
// IS a cover. Half of the 96px avatar used on the profile screen -- keep
// ProfileHeader's top spacing in sync with this if the avatar size ever changes.
export const AVATAR_OVERLAP = 48;

type VisibleStatusForCover = {
  kind: 'home' | 'traveling' | 'planning';
  city?: string; // missing when the viewer's privacy level doesn't include it
};

type ProfileCoverProps = {
  coverMode: 'auto' | 'custom' | 'none';
  coverImage?: string; // only used when coverMode is 'custom'
  visibleStatus: VisibleStatusForCover | null; // null when status is hidden from this viewer entirely
  dreamTrip?: string; // fallback city when home, or when the city isn't visible
  avatar?: ReactNode; // rendered overlapping the cover's bottom edge, centered (or inline, when there's no cover)
  isOwnProfile: boolean;
  pendingRequestCount?: number; // own profile only; the inbox icon's red badge
  onSettingsPress?: () => void;
  onInboxPress?: () => void;
  onBackPress?: () => void;
  onMenuPress?: () => void;
};

// The city to show on an 'auto' cover, or null if there's nothing to show.
function coverCity(visibleStatus: VisibleStatusForCover | null, dreamTrip?: string): string | null {
  if (visibleStatus && visibleStatus.kind !== 'home' && visibleStatus.city) {
    return visibleStatus.city;
  }
  return dreamTrip ?? null;
}

// Whether this profile actually shows a cover band at all. 'auto' can still
// end up with nothing to show (home, with no dream trip, or a hidden status),
// in which case it falls back to the same no-cover layout as 'none'.
export function hasVisibleCover(
  coverMode: 'auto' | 'custom' | 'none',
  coverImage: string | undefined,
  visibleStatus: VisibleStatusForCover | null,
  dreamTrip: string | undefined,
): boolean {
  if (coverMode === 'none') return false;
  if (coverMode === 'custom') return !!coverImage;
  return coverCity(visibleStatus, dreamTrip) !== null;
}

export function ProfileCover({
  coverMode,
  coverImage,
  visibleStatus,
  dreamTrip,
  avatar,
  isOwnProfile,
  pendingRequestCount = 0,
  onSettingsPress,
  onInboxPress,
  onBackPress,
  onMenuPress,
}: ProfileCoverProps) {
  const city = coverCity(visibleStatus, dreamTrip);
  const showsCover = hasVisibleCover(coverMode, coverImage, visibleStatus, dreamTrip);

  const topBar = (
    <View style={[styles.topBar, !showsCover && styles.topBarNoCover]}>
      {isOwnProfile ? (
        <>
          <View style={styles.spacer} />
          {pendingRequestCount > 0 && (
            <Pressable onPress={onInboxPress} style={styles.iconButton}>
              <Text style={styles.icon}>📥</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequestCount}</Text>
              </View>
            </Pressable>
          )}
          <Pressable onPress={onSettingsPress} style={styles.iconButton}>
            <Text style={styles.icon}>☰</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable onPress={onBackPress} style={styles.iconButton}>
            <Text style={styles.icon}>←</Text>
          </Pressable>
          <Pressable onPress={onMenuPress} style={styles.iconButton}>
            <Text style={styles.icon}>•••</Text>
          </Pressable>
        </>
      )}
    </View>
  );

  if (!showsCover) {
    // No band at all: the top bar sits on the plain page background, and the
    // avatar is laid out inline underneath it instead of overlapping anything.
    return (
      <View>
        {topBar}
        {avatar && <View style={styles.avatarInline}>{avatar}</View>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {coverMode === 'custom' && coverImage ? (
        <Image source={{ uri: coverImage }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>{city && <Text style={styles.placeholderText}>{city}</Text>}</View>
      )}

      {topBar}

      {avatar && <View style={styles.avatarOverlap}>{avatar}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    backgroundColor: '#cfd8e3',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  topBarNoCover: {
    position: 'relative',
  },
  spacer: {
    flex: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  icon: {
    color: '#fff',
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#e53e3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarOverlap: {
    position: 'absolute',
    bottom: -AVATAR_OVERLAP,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatarInline: {
    alignItems: 'center',
    paddingTop: 8,
  },
});
