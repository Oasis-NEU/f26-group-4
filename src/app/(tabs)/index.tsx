import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceCard } from '@/components/place-card';
import { SearchFilterBar } from '@/components/search-filter-bar';
import { useFilterOptions, usePlaces } from '@/hooks/use-places';

// Feed: one place card per place, in a vertical list

export default function FeedScreen() {
  const { width } = useWindowDimensions();

  // Search text and filters; changing any of them loads the matching places
  const [query, setQuery] = useState('');
  const [placeTypes, setPlaceTypes] = useState<string[]>([]);
  const [suitedFor, setSuitedFor] = useState<string[]>([]);
  const filterOptions = useFilterOptions();

  const places = usePlaces({ query, placeTypes, suitedFor });

  // Pull to refresh. A local flag, because isRefetching is also true during
  // background refetches (docs/data-layer.md, "Showing states").
  const [refreshing, setRefreshing] = useState(false);
  async function handleRefresh() {
    setRefreshing(true);
    await places.refetch();
    setRefreshing(false);
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

      {places.isPending ? (
        <ActivityIndicator style={styles.center} />
      ) : places.isError ? (
        <View style={styles.center}>
          <Text>Something went wrong loading places.</Text>
          <Button title="Try again" onPress={() => places.refetch()} />
        </View>
      ) : (
        <FlatList
          data={places.data}
          keyExtractor={(place) => place.id}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              width={width}
              onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })}
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
