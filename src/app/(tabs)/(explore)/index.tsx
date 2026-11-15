import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceCard } from '@/components/place-card';
import { SearchFilterBar } from '@/components/search-filter-bar';
import { SuggestionStrip } from '@/components/suggestion-strip';
import { getPlaces, PLACE_TYPES, SUITED_FOR, toggleBookmark } from '@/services/places';
import type { Suggestion } from '@/services/suggestions';
import type { Place } from '@/types/place';

// Explore: the app's home screen. A row of city tiles across the top, then one
// place card per place in a vertical list underneath.
//
// This used to be two tabs. "Explore" was a separate page of big city tiles,
// and tapping one opened a third screen listing that city's places -- the same
// places as the feed, reached a different way. They're one screen now: the
// tiles filter the list underneath instead of going anywhere.
//
// A tile is a theme like "Hikes in France", not just a city. What it stands
// for is a set of CollectionRules, the same type collections use, which the
// feed passes straight to getPlaces().

export default function ExploreScreen() {
  const { width } = useWindowDimensions();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Search text and filters; changing any of them re-fetches the list.
  // The tile at the top is a filter like the others -- the whole Suggestion is
  // kept rather than just its rules, so the row knows which one to light up
  // and the empty state can say which one found nothing.
  const [query, setQuery] = useState('');
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [placeTypes, setPlaceTypes] = useState<string[]>([]);
  const [suitedFor, setSuitedFor] = useState<string[]>([]);

  const load = useCallback(async () => {
    setError(false);
    try {
      setPlaces(await getPlaces({ query, rules: suggestion?.rules, placeTypes, suitedFor }));
    } catch {
      setError(true);
    }
  }, [query, suggestion, placeTypes, suitedFor]);

  useEffect(() => {
    // `ignore` stops an older, slower request from overwriting a newer one while typing
    let ignore = false;
    getPlaces({ query, rules: suggestion?.rules, placeTypes, suitedFor })
      .then((result) => {
        if (ignore) return;
        setError(false);
        setPlaces(result);
      })
      .catch(() => !ignore && setError(true))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [query, suggestion, placeTypes, suitedFor]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleBookmark(placeId: string) {
    // TODO: open the "Save to collection" sheet instead of toggling directly
    const isSaved = await toggleBookmark(placeId);
    setPlaces((prev) => prev.map((p) => (p.id === placeId ? { ...p, bookmark: isSaved } : p)));
  }

  function clearFilters() {
    setQuery('');
    setSuggestion(null);
    setPlaceTypes([]);
    setSuitedFor([]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <SearchFilterBar
        query={query}
        onChangeQuery={setQuery}
        placeTypes={placeTypes}
        suitedFor={suitedFor}
        onChangePlaceTypes={setPlaceTypes}
        onChangeSuitedFor={setSuitedFor}
        placeTypeOptions={PLACE_TYPES}
        suitedForOptions={SUITED_FOR}
        right={
          <Pressable onPress={() => router.push('/upload')} accessibilityRole="button" accessibilityLabel="New post" hitSlop={8}>
            <Text style={styles.plus}>+</Text>
          </Pressable>
        }
      />

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <View style={styles.center}>
          <Text>Something went wrong loading places.</Text>
          <Button title="Try again" onPress={handleRefresh} />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(place) => place.id}
          // In the header rather than above the list, so the tiles scroll
          // away as you read instead of taking up the top of the screen the
          // whole time.
          ListHeaderComponent={
            <SuggestionStrip selectedId={suggestion?.id ?? null} onSelect={setSuggestion} />
          }
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              width={width}
              onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })}
              onBookmarkPress={() => handleBookmark(item.id)}
            />
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text>
                {suggestion === null
                  ? 'No places match your search'
                  : `Nothing under ${suggestion.title} matches your search`}
              </Text>
              <Button title="Clear filters" onPress={clearFilters} />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  plus: {
    fontSize: 28,
    lineHeight: 30,
  },
});
