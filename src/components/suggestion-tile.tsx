import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import type { Suggestion } from '@/lib/suggestions';
import { colors, radius, spacing, type } from '@/theme';

// One tile in the row across the top of Explore: a photo with a theme written
// across it, like "Hikes in France" or "Food in Japan".
//
// It's a FILTER, not a place and not a page. Tapping it narrows the feed
// underneath, so it shows a tick when it's the one switched on -- it has
// nowhere to take you.
//
// The look is carried over from the old CityTile on the Explore page, with one
// fix: there's a SCRIM now. White text was sitting straight on the photo, so
// it disappeared against anything pale -- and while the photo was still
// loading the tile was light grey, which made white text invisible. The scrim
// is a dark wash between the photo and the text, and it's in the design system
// for exactly this (colors.scrim in src/theme.ts).

type SuggestionTileProps = {
  suggestion: Suggestion;
  width: number;
  height: number;
  selected: boolean;
  onPress: () => void;
};

export function SuggestionTile({ suggestion, width, height, selected, onPress }: SuggestionTileProps) {
  // "1 place", "4 places". Worked out once so the words on the tile and the
  // words a screen reader says can't drift apart.
  const countLabel = `${suggestion.placeCount} ${suggestion.placeCount === 1 ? 'place' : 'places'}`;

  return (
    <Pressable
      style={[styles.tile, { width, height }, selected && styles.tileSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${suggestion.title}. ${countLabel}`}
    >
      <Image source={{ uri: suggestion.coverImage }} style={styles.image} contentFit="cover" />

      {/* The dark wash that keeps the words readable whatever the photo is. */}
      <View style={styles.scrim} />

      {/* Decorative: the whole tile is the button, so this isn't announced
          twice. Only shown when the tile is the one switched on. */}
      {selected && (
        <View style={styles.tickRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.tick}>
            <Icon name="check" size={13} color={colors.overlayIcon} />
          </View>
        </View>
      )}

      <View style={styles.bottom}>
        <Text style={styles.title} numberOfLines={3}>
          {suggestion.title}
        </Text>
        <Text style={styles.count}>{countLabel}</Text>
      </View>
    </Pressable>
  );
}

// "cover the whole parent". Written out rather than using
// StyleSheet.absoluteFillObject, which React Native 0.88 no longer types.
const fill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.collection,
    overflow: 'hidden', // keeps the photo inside the rounded corners
    // Dark, not the usual light grey, so the white text is still readable in
    // the moment before the photo arrives.
    backgroundColor: colors.ink,
    justifyContent: 'flex-end',
  },
  image: {
    ...fill,
  },
  scrim: {
    ...fill,
    backgroundColor: colors.scrim,
  },
  // The one outline here: it's how you tell which tile the feed is filtered to.
  tileSelected: {
    borderWidth: 3,
    borderColor: colors.ink,
  },
  tickRow: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  bottom: {
    padding: spacing.md,
    gap: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: type.heading,
    lineHeight: 20,
    letterSpacing: -0.4,
    color: colors.textOnDark,
  },
  count: {
    fontSize: type.tiny,
    lineHeight: 14,
    letterSpacing: 0.3,
    color: colors.textOnDark,
  },
});
