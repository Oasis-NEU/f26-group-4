import { Pressable, StyleSheet, Text, View } from 'react-native';

// The "Places · Followers · Following" row under the profile header.
// On someone else's profile, an optional strip underneath shows overlap
// with the viewer, e.g. "You've both been to Paris, Rome, and 2 more".

type StatProps = {
  label: string;
  value: number;
  onPress?: () => void;
};

function Stat({ label, value, onPress }: StatProps) {
  return (
    <Pressable style={styles.stat} onPress={onPress} disabled={!onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

type ProfileStatsProps = {
  placesCount: number;
  followersCount: number;
  followingCount: number;
  onPressPlaces?: () => void;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
  overlapText?: string; // e.g. "You've both been to Paris, Rome, and 2 more"; other profiles only
};

export function ProfileStats({
  placesCount,
  followersCount,
  followingCount,
  onPressPlaces,
  onPressFollowers,
  onPressFollowing,
  overlapText,
}: ProfileStatsProps) {
  return (
    <View>
      <View style={styles.row}>
        <Stat label="Places" value={placesCount} onPress={onPressPlaces} />
        <Stat label="Followers" value={followersCount} onPress={onPressFollowers} />
        <Stat label="Following" value={followingCount} onPress={onPressFollowing} />
      </View>

      {overlapText && <Text style={styles.overlap}>{overlapText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    color: 'gray',
  },
  overlap: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    color: '#555',
  },
});
