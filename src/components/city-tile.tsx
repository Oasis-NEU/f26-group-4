import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { City } from '@/services/cities';
import { colors, radius, spacing, type } from '@/theme';

// One tile on the Explore page: a photo of a city with its country in the top
// corner and the city name across the bottom.
//
// The tile is a filter, not a place -- tapping it opens everything we have in
// that city. The parent decides what that means by passing onPress.
//

type CityTileProps = {
  city: City;
  height: number; // the grid gives each tile a different height, see explore-page.tsx
  onPress: () => void;
};

export function CityTile({ city, height, onPress }: CityTileProps) {
  return (
    <Pressable
      style={[styles.tile, { height }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${city.name}, ${city.country}. ${city.placeCount} places`}
    >
      <Image source={{ uri: city.coverImage }} style={styles.image} contentFit="cover" />

      <View style={styles.topRow}>
        <View style={styles.labels}>
          {/* The country only. NOT a place type -- a tile stands for a whole
              city, and labelling it "cafe" because one of its places is a cafe
              reads as though the tile were a single place. */}
          <Text style={styles.country} numberOfLines={1}>
            {city.country}
          </Text>
        </View>

        {/* The arrow in the corner. Decorative -- the whole tile is the button,
            so it's hidden from screen readers rather than announced twice. */}
        <View style={styles.arrow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.arrowGlyph}>↗</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.name} numberOfLines={2}>
          {city.name}
        </Text>
        <Text style={styles.count}>
          {city.placeCount} {city.placeCount === 1 ? 'place' : 'places'}
        </Text>
      </View>
    </Pressable>
  );
}

// "cover the whole parent". Written out rather than using
// StyleSheet.absoluteFillObject, which React Native 0.88 no longer types.
const fill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

const styles = StyleSheet.create({
  tile: {
    // No `flex` here on purpose: the tile is given an exact height by the
    // grid, and a flex value lets the column shrink it back down again.
    // It stretches to the full width of its column on its own.
    borderRadius: radius.collection,
    overflow: 'hidden', // keeps the photo inside the rounded corners
    backgroundColor: colors.fill, // shows while the photo loads
    justifyContent: 'space-between',
  },
  // The photo fills the whole tile and everything else sits on top of it.
  image: {
    ...fill,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
  },
  labels: {
    flex: 1, // so a long country name wraps instead of pushing the arrow off
  },
  country: {
    fontWeight: '600',
    fontSize: type.body,
    color: colors.textOnDark,
  },
  arrow: {
    width: 26,
    height: 26,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  arrowGlyph: {
    fontSize: type.small,
    lineHeight: 16,
    color: colors.overlayIcon,
  },
  bottom: {
    padding: spacing.md,
    flexShrink: 1, // a two-line name shrinks rather than pushing the count out
  },
  name: {
    fontWeight: 'bold',
    // Bigger than `type.title`, because on a tile the city name is the whole
    // point -- it's a heading, not a label on a card.
    fontSize: 27,
    // Tight line height so a two-line name ("Les Deux Alpes") still fits in
    // the shortest tile in the grid.
    lineHeight: 29,
    letterSpacing: -0.8,
    color: colors.textOnDark,
  },
  count: {
    fontSize: type.small,
    lineHeight: 17,
    letterSpacing: 0.6,
    color: colors.textOnDark,
  },
});
