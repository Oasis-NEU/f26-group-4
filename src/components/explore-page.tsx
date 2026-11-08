import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityTile } from '@/components/city-tile';
import { FilterPill, SearchField } from '@/components/ui';
import { getCities, type City } from '@/services/cities';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { colors, spacing, type } from '@/theme';

// Explore: a grid of cities. Each tile is a filter -- tap Florence and you get
// everything we have in Florence, as a feed or a list.
//
// The tiles are ordered by the city's popularity score, which lives in
// src/services/cities.ts. Right now that's worked out from how many places and
// reviews a city has; when the backend starts tracking views and saves, that
// function changes and this page doesn't.

// The tiles are different heights so the grid doesn't look like a spreadsheet.
// These are multipliers on the column width, used in order and then repeated,
// so the same city always gets the same shape.
const TILE_SHAPES = [1.5, 1.15, 1.2, 1.4, 1.2, 1.35];

// No tile is ever shorter than this, whatever the screen width.
const MIN_TILE_HEIGHT = 160;

// Splits the cities into two columns, always adding the next city to whichever
// column is currently shorter. That's what keeps the two sides roughly level
// even though every tile is a different height.
function splitIntoColumns(cities: City[], columnWidth: number) {
  const columns: { city: City; height: number }[][] = [[], []];
  const heights = [0, 0];

  cities.forEach((city, index) => {
    // A floor as well as a shape: on a narrow screen the columns get thin
    // enough that a two-line city name ("Les Deux Alpes") won't fit in the
    // shortest tile, and the place count underneath gets cut off.
    const height = Math.max(MIN_TILE_HEIGHT, Math.round(columnWidth * TILE_SHAPES[index % TILE_SHAPES.length]));
    const target = heights[0] <= heights[1] ? 0 : 1;
    columns[target].push({ city, height });
    heights[target] += height;
  });

  return columns;
}

export function ExplorePage() {
  const { width } = useWindowDimensions();

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [query, setQuery] = useState('');
  const filterOptions = useFilterOptions();
  // Which category pill is on. `null` is the "Explore" pill -- no filter.
  const [placeType, setPlaceType] = useState<string | null>(null);

  useEffect(() => {
    // `ignore` stops an older, slower request from overwriting a newer one
    // while someone is still typing.
    let ignore = false;
    getCities({ query, placeType: placeType ?? undefined })
      .then((result) => {
        if (ignore) return;
        setError(false);
        setCities(result);
      })
      .catch(() => !ignore && setError(true))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [query, placeType]);

  // Two columns of page margin, one gap between the columns.
  const columnWidth = (width - spacing.lg * 2 - spacing.md) / 2;
  // useMemo so the columns are only worked out again when the cities or the
  // screen width actually change, not on every keystroke.
  const columns = useMemo(() => splitIntoColumns(cities, columnWidth), [cities, columnWidth]);

  function openCity(city: City) {
    router.push({ pathname: '/city/[id]', params: { id: city.id } });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search cities" />

        {/* The category filters, right under the search field. "Explore" is
            the off switch: it clears the category. The row scrolls sideways
            because there are more place types than fit on a phone. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          keyboardShouldPersistTaps="handled"
        >
          <FilterPill label="Explore" selected={placeType === null} onPress={() => setPlaceType(null)} />
          {filterOptions.placeTypes.map((option) => (
            <FilterPill
              key={option}
              label={option}
              selected={placeType === option}
              // Tapping the pill that's already on turns it off again.
              onPress={() => setPlaceType((current) => (current === option ? null : option))}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>Something went wrong loading cities.</Text>
        </View>
      ) : cities.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.message}>No cities match that.</Text>
          <Pressable
            onPress={() => {
              setQuery('');
              setPlaceType(null);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.link}>Clear filters</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          // Room at the bottom so the last row isn't hidden behind the
          // floating category bar.
          contentInset={{ bottom: 0 }}
        >
          {columns.map((column, columnIndex) => (
            <View key={columnIndex} style={styles.column}>
              {column.map(({ city, height }) => (
                <CityTile key={city.id} city={city} height={height} onPress={() => openCity(city)} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    fontSize: type.screenTitle,
    letterSpacing: -1,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl
  },
  column: {
    flex: 1,
    gap: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    // The row sits inside the header, which already has the page margin, so
    // this cancels it out -- the pills scroll all the way to both edges
    // instead of stopping short of them.
    paddingHorizontal: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  message: {
    fontSize: type.body,
    color: colors.textMuted,
  },
  link: {
    fontWeight: '600',
    fontSize: type.body,
    color: colors.link,
  },
});
