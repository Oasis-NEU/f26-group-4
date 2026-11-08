import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// The banner at the top of a profile. Shows a photo if the user picked one;
// otherwise shows which city to feature (the city they're currently traveling/
// planning to, or -- if they're home, or the viewer can't see their city --
// their dream trip) as a colored placeholder, since there's no photo source
// for "a picture of Rome" yet.
//
// `visibleStatus` must already be trimmed for the viewer (see getVisibleStatus,
// planned in src/services/users.ts) -- this component never decides privacy,
// it only decides city vs. dream trip vs. nothing.
//
// Settings (☰) + inbox are own-profile only. Back + ••• menu are for everyone else's.

type VisibleStatusForCover = {
  kind: 'home' | 'traveling' | 'planning';
  city?: string; // missing when the viewer's privacy level doesn't include it
};

type ProfileCoverProps = {
  coverImage?: string; // a manual photo the user picked; wins over everything else
  visibleStatus: VisibleStatusForCover | null; // null when status is hidden from this viewer entirely
  dreamTrip?: string; // fallback city when home, or when the city isn't visible
  isOwnProfile: boolean;
  pendingRequestCount?: number; // own profile only; the inbox icon's red badge
  onSettingsPress?: () => void;
  onInboxPress?: () => void;
  onBackPress?: () => void;
  onMenuPress?: () => void;
};

// The city to show on the cover, or null if there's nothing to show.
function coverCity(visibleStatus: VisibleStatusForCover | null, dreamTrip?: string): string | null {
  if (visibleStatus && visibleStatus.kind !== 'home' && visibleStatus.city) {
    return visibleStatus.city;
  }
  return dreamTrip ?? null;
}

export function ProfileCover({
  coverImage,
  visibleStatus,
  dreamTrip,
  isOwnProfile,
  pendingRequestCount = 0,
  onSettingsPress,
  onInboxPress,
  onBackPress,
  onMenuPress,
}: ProfileCoverProps) {
  const city = coverCity(visibleStatus, dreamTrip);

  return (
    <View style={styles.container}>
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>{city && <Text style={styles.placeholderText}>{city}</Text>}</View>
      )}

      <View style={styles.topBar}>
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
});
