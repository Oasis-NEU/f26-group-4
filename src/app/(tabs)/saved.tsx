import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CollectionCard } from '@/components/collection-card';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SavedPlaceRow } from '@/components/saved-place-row';
import { ALL_SAVED_ID, useCollections } from '@/hooks/use-collections';
import { useAllSavedPlaces, useLooseSavedPlaces } from '@/hooks/use-saves';
import { Collection } from '@/types/collection';
import { colors, spacing, type } from '@/theme';
import { FilterPill } from '@/components/ui';

// The Saved tab: the user's collections, and the places they've saved
// but not put in a collection yet.
//
// NOTE: docs/pages/05-saved-collections.md asks for a search box and a sort
// control at the top. This uses filter pills instead for now.

export default function SavedPage() {
  // The three lists come from the shared cache. Saving or unsaving anywhere
  // refreshes them, so this tab is up to date whenever you come back to it.
  const collectionsQuery = useCollections();
  const looseQuery = useLooseSavedPlaces();
  const allSavedQuery = useAllSavedPlaces();
  const isLoading = collectionsQuery.isPending || looseQuery.isPending || allSavedQuery.isPending;
  const collections = collectionsQuery.data ?? [];
  const savedPlaces = looseQuery.data ?? [];
  const allSavedPlaces = allSavedQuery.data ?? [];

  // Which filter pill is selected. 'All' means don't filter anything out.
  const [selectedFilter, setSelectedFilter] = useState('All');

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  // Build the filter pills: "All", then one per country we actually have places in.
  const countries: string[] = [];
  for (const place of allSavedPlaces) {
    if (!countries.includes(place.country)) {
      countries.push(place.country);
    }
  }
  const filters = ['All', ...countries];

  // Does this collection have any place from the selected country?
  function collectionMatchesFilter(collection: Collection) {
    if (selectedFilter === 'All') {
      return true;
    }

    for (const place of collection.places) {
      if (place.country === selectedFilter) {
        return true;
      }
    }

    if (collection.subCollections !== undefined) {
      for (const sub of collection.subCollections) {
        for (const place of sub.places) {
          if (place.country === selectedFilter) {
            return true;
          }
        }
      }
    }

    return false;
  }

  const visibleCollections = collections.filter(collectionMatchesFilter);

  const visiblePlaces = savedPlaces.filter((place) => {
    if (selectedFilter === 'All') {
      return true;
    }
    return place.country === selectedFilter;
  });

  // "All saved" is always the first card. It isn't a real collection the user made,
  // so it gets built here out of every saved place.
  const allSavedCard: Collection = {
    id: ALL_SAVED_ID,
    name: 'All saved',
    places: allSavedPlaces,
  };

  // Expo Router checks these paths, so the route is named with [id] in it and the
  // real id is passed separately as a param.
  function openCollection(collectionId: string) {
    router.push({ pathname: '/collection/[id]', params: { id: collectionId } });
  }

  function openPlace(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } });
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.pageTitle}>Saved</Text>

      {/* Filter pills. Tapping one stores its name, and the lists below get filtered. */}
      <ScrollView
        horizontal
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter) => (
          <FilterPill
            key={filter}
            label={filter}
            selected={selectedFilter === filter}
            onPress={() => setSelectedFilter(filter)}
          />
        ))}
      </ScrollView>

      <Text style={styles.sectionHeading}>Collections</Text>

      {/* The "All saved" card only makes sense when nothing is filtered out */}
      {selectedFilter === 'All' && (
        <CollectionCard
          collection={allSavedCard}
          index={0}
          onPress={() => openCollection(allSavedCard.id)}
        />
      )}

      {visibleCollections.length === 0 && selectedFilter !== 'All' ? (
        <Text style={styles.emptyText}>No collections in {selectedFilter}.</Text>
      ) : (
        // `index` here is the position in the list -- it picks which of the
        // three gradients the tile uses, so neighbouring tiles don't match.
        visibleCollections.map((collection, index) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            index={index + 1}
            onPress={() => openCollection(collection.id)}
          />
        ))
      )}

      <Text style={styles.sectionHeading}>Saved places</Text>

      {visiblePlaces.length === 0 ? (
        <Text style={styles.emptyText}>
          Nothing saved yet. Tap the bookmark on any place to save it here.
        </Text>
      ) : (
        visiblePlaces.map((place) => (
          <SavedPlaceRow key={place.id} place={place} onPress={() => openPlace(place.id)} />
        ))
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontWeight: 'bold',
    fontSize: type.screenTitle,
    letterSpacing: -1,
    color: colors.text,
  },
  filterRow: {
    // A horizontal list inside a vertical one. marginHorizontal cancels out the
    // page padding so the pills can scroll all the way to the screen edge.
    marginHorizontal: -spacing.lg,
  },
  filterRowContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeading: {
    fontWeight: 'bold',
    fontSize: type.heading,
    letterSpacing: -0.5,
    paddingTop: spacing.sm,
    color: colors.text,
  },
  emptyText: {
    fontSize: type.body,
    color: colors.textMuted,
  },
});
