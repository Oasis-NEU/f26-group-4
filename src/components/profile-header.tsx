import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCountryFlag } from '@/utils/country-flags';
import type { Profile, VisibleTravelStatus } from '@/types/profile';

// Shows who this profile belongs to: name, username, where they live, and
// their travel status (already privacy-trimmed by the caller -- see
// getVisibleStatus in services/users.ts). Shows "Edit profile" on your own
// profile, or "Follow"/"Following" + Share on someone else's.
// The avatar itself is rendered by the caller, overlapping ProfileCover --
// see ProfileCover's `avatar` prop.

// getCountryFlag (src/utils/country-flags.ts) looks up by full country name,
// but Profile stores 2-letter codes, so codes are converted here first.
// TODO: only covers the countries in our mock data; ask Ruby about adding
// code-based lookup to country-flags.ts directly instead of this list.
const COUNTRY_NAME_BY_CODE: Record<string, string> = {
  US: 'United States',
  FR: 'France',
  IT: 'Italy',
  DE: 'Germany',
  ES: 'Spain',
  PT: 'Portugal',
  AT: 'Austria',
  CH: 'Switzerland',
};

function flagForCode(code: string): string {
  const name = COUNTRY_NAME_BY_CODE[code];
  return name ? getCountryFlag(name) : '';
}

// "Nov 20" from "2026-11-20"; "Dec" from "2026-12".
function formatUntil(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonth(isoMonth: string): string {
  const date = new Date(`${isoMonth}-01`);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

// The status pill's text, or null when there's nothing to show (hidden status).
function statusText(status: VisibleTravelStatus | null): string | null {
  if (!status) return null;
  if (status.kind === 'home') return 'Home';

  const label = status.kind === 'traveling' ? 'Traveling' : 'Planning';
  const place = status.city ? `${status.city}, ${status.country}` : status.country;

  if (status.kind === 'traveling' && status.until) {
    return `${label} · ${place} · until ${formatUntil(status.until)}`;
  }
  if (status.kind === 'planning' && status.month) {
    return `${label} · ${place} · ${formatMonth(status.month)}`;
  }
  return `${label} · ${place}`;
}

type ProfileHeaderProps = {
  profile: Profile; // the profile data to display
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
  visibleStatus,
  isOwnProfile,
  isFollowing,
  onEditPress,
  onFollowPress,
  onSharePress,
  notifyBell,
}: ProfileHeaderProps) {
  const pill = statusText(visibleStatus);

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.username}>@{profile.username}</Text>

      <Text>
        Lives in {profile.homeCity} {flagForCode(profile.homeCountry)}
      </Text>
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
