import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

// A person's picture, or -- if they don't have one -- their initials on a soft
// color. The color is picked from their name, so the same person always gets
// the same color. Used anywhere a profile picture shows up (profile header,
// friend suggestions, the follow-requests inbox, etc).

// Soft, readable-with-white-text colors. Picked by hashing the name so it's
// deterministic (no color flashing/changing between renders).
const FALLBACK_COLORS = ['#E07A5F', '#3D8D7A', '#5C7AEA', '#B5838D', '#F2A541', '#6A994E'];

function colorForName(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function initialsForName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

type AvatarProps = {
  name: string; // used for initials and to pick the fallback color
  photoUrl?: string; // when missing, falls back to initials-on-color
  size?: number; // diameter in px
};

export function Avatar({ name, photoUrl, size = 56 }: AvatarProps) {
  const shapeStyle = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={[styles.image, shapeStyle]} />;
  }

  return (
    <View style={[styles.fallback, shapeStyle, { backgroundColor: colorForName(name) }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initialsForName(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {},
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '600',
  },
});
