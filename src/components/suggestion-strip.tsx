import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SuggestionTile } from '@/components/suggestion-tile';
import { useSuggestions } from '@/hooks/use-places';
import type { Suggestion } from '@/lib/suggestions';
import { colors, spacing, type } from '@/theme';

// The row of tiles across the top of Explore: "Hikes in France", "Food in
// Japan". Tapping one filters the feed underneath; tapping it again clears it.
//
// This is what's left of the old Explore page. That was a whole screen of city
// tiles, and tapping one opened a THIRD screen listing that city's places --
// the same places the feed already showed, reached a different way. Now it's a
// row at the top of the feed and nothing navigates anywhere.
//
// The tiles are more specific than the cities they replaced. "Florence" became
// "Food in Florence", "Gardens in Italy", and so on, because a whole city is a
// blunt thing to tap when what you want is dinner. Where they come from, and
// how they should eventually be picked for the person looking at them, is in
// src/lib/suggestions.ts.

// A fixed size, because they sit in a row that scrolls sideways -- they can't
// stretch to fit the screen the way the old grid's tiles did.
const TILE_WIDTH = 148;
const TILE_HEIGHT = 168;

type SuggestionStripProps = {
  // The id of the tile that's switched on, or null if none is.
  selectedId: string | null;

  // Gives back the tile that was tapped, or null when the one that's already
  // on is tapped again.
  onSelect: (suggestion: Suggestion | null) => void;
};

export function SuggestionStrip({ selectedId, onSelect }: SuggestionStripProps) {
  // Worked out from every place, not the filtered list. These don't narrow as
  // you type the way the old Explore page's tiles did -- the search box
  // filters the PLACES underneath now, and having the row empty itself while
  // you typed would be odd.
  const suggestions = useSuggestions().data ?? [];

  // Nothing to show before they arrive. No spinner on purpose: this sits above
  // the real content, and a spinner here would shove the feed down and then
  // back up again.
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Explore</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {suggestions.map((suggestion) => {
          const isSelected = selectedId === suggestion.id;

          return (
            <SuggestionTile
              key={suggestion.id}
              suggestion={suggestion}
              width={TILE_WIDTH}
              height={TILE_HEIGHT}
              selected={isSelected}
              // Tapping the one that's already on turns it off, so the row is
              // its own way of clearing the filter.
              onPress={() => onSelect(isSelected ? null : suggestion)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: type.heading,
    letterSpacing: -0.5,
    color: colors.text,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
