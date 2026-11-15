import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

// A person's picture, or -- if they don't have one -- their initials on a
// soft color. The color comes from `avatarHue` (0-359) if the profile has
// one, otherwise it's derived from their user id so it's stable even if they
// rename themselves. If a photo fails to load, this falls back to initials
// instead of a broken-image icon. Used anywhere a profile picture shows up
// (profile header, friend suggestions, the follow-requests inbox, etc).

function hashString(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function hueForUserId(userId: string): number {
  return hashString(userId) % 360;
}

// First letter of the first and last word of the name ("Maya Chen" -> "MC").
// One word -> one letter. No name at all -> first letter of the username.
function initialsFor(name: string, username?: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return username ? username[0].toUpperCase() : '?';
  }
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

type AvatarProps = {
  name: string; // used for initials
  username?: string; // fallback initial when there's no name at all
  uri?: string; // the photo; missing (or failing to load) falls back to initials
  userId: string; // picks a stable color when avatarHue isn't set
  avatarHue?: number; // 0-359; overrides the userId-derived color
  size?: number; // diameter in px
};

export function Avatar({ name, username, uri, userId, avatarHue, size = 56 }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const colorScheme = useColorScheme();
  const shapeStyle = { width: size, height: size, borderRadius: size / 2 };

  const hue = avatarHue ?? hueForUserId(userId);
  const isDark = colorScheme === 'dark';
  // Soft backgrounds (light = very pale, dark = muted), with text darkened/
  // lightened the same hue so initials stay readable either way.
  const backgroundColor = isDark ? `hsl(${hue}, 28%, 32%)` : `hsl(${hue}, 55%, 86%)`;
  const textColor = isDark ? `hsl(${hue}, 30%, 88%)` : `hsl(${hue}, 45%, 28%)`;

  return (
    <View style={[styles.fallback, shapeStyle, { backgroundColor }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4, color: textColor }]}>{initialsFor(name, username)}</Text>

      {/* Layered on top of the initials so there's never a grey flash -- the
          initials show immediately, and the photo fades in over them once loaded. */}
      {uri && !imageFailed && (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, shapeStyle]}
          transition={200}
          onError={() => setImageFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '600',
  },
});
