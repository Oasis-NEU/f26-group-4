import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
// KEEPING THE WORDS READABLE. White text straight on a photo disappears
// against anything pale, and while the photo is still loading the tile would
// be a flat colour with invisible text on it. So there's a gradient behind
// the text: see-through at the top, dark at the bottom.
//
// It fades rather than covering the tile, and it has no colour in it. The
// design system's `colors.scrim` is purple-tinted, which cast a haze over
// every photo -- fine for darkening the bottom of a big hero image, wrong
// here where the photo is most of what you see. `colors.scrimNeutral` is the
// same idea without the tint.

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

      {/* Clear at the top, dark at the bottom, so the words have something to
          sit on without the photo being dimmed. */}
      <LinearGradient
        colors={['transparent', colors.scrimNeutral]}
        // Starts just under half way down: above that the photo is untouched.
        locations={[0.45, 1]}
        style={styles.fade}
      />

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
        <Text style={styles.title} numberOfLines={2}>
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
  fade: {
    ...fill,
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
