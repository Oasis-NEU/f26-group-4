import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceCard } from '@/components/place-card';
import { SearchFilterBar } from '@/components/search-filter-bar';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { getPlaces, toggleBookmark } from '@/services/places';
import type { Place } from '@/types/place';

// Feed: one place card per place, in a vertical list

export default function FeedScreen() {
  const { width } = useWindowDimensions();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Search text and filters; changing any of them re-fetches the list
  const [query, setQuery] = useState('');
  const [placeTypes, setPlaceTypes] = useState<string[]>([]);
  const [suitedFor, setSuitedFor] = useState<string[]>([]);
  const filterOptions = useFilterOptions();

  const load = useCallback(async () => {
    setError(false);
    try {
      setPlaces(await getPlaces({ query, placeTypes, suitedFor }));
    } catch {
      setError(true);
    }
  }, [query, placeTypes, suitedFor]);

  useEffect(() => {
    // `ignore` stops an older, slower request from overwriting a newer one while typing
    let ignore = false;
    getPlaces({ query, placeTypes, suitedFor })
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
  }, [query, placeTypes, suitedFor]);

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
        placeTypeOptions={filterOptions.placeTypes}
        suitedForOptions={filterOptions.suitedFor}
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
              <Text>No places match your search</Text>
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
