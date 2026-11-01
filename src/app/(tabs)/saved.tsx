import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CollectionCard } from '@/components/collection-card';
import { SavedPlaceRow } from '@/components/saved-place-row';
import {
  ALL_SAVED_ID,
  getAllSavedPlaces,
  getCollections,
  getSavedPlaces,
} from '@/services/collections';
import { Collection } from '@/types/collection';
import { Place } from '@/types/place';

// The Saved tab: the user's collections, and the places they've saved
// but not put in a collection yet.
//
// NOTE: docs/pages/05-saved-collections.md asks for a search box and a sort
// control at the top. This uses filter pills instead for now.

export default function SavedPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [allSavedPlaces, setAllSavedPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Which filter pill is selected. 'All' means don't filter anything out.
  const [selectedFilter, setSelectedFilter] = useState('All');

  useEffect(() => {
    // Ask for all three lists, then put them in state.
    getCollections().then((result) => setCollections(result));
    getSavedPlaces().then((result) => setSavedPlaces(result));
    getAllSavedPlaces().then((result) => {
      setAllSavedPlaces(result);
      setIsLoading(false);
    });
    // TODO: reload this when the tab comes back into view (useFocusEffect), or a place
    // bookmarked somewhere else won't show up here until the app restarts.
  }, []);

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
          <Pressable
            key={filter}
            style={[styles.filterPill, selectedFilter === filter && styles.filterPillSelected]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={styles.filterText}>{filter}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionHeading}>Collections</Text>

      {/* The "All saved" card only makes sense when nothing is filtered out */}
      {selectedFilter === 'All' && (
        <CollectionCard
          collection={allSavedCard}
          onPress={() => openCollection(allSavedCard.id)}
        />
      )}

      {visibleCollections.length === 0 && selectedFilter !== 'All' ? (
        <Text style={styles.emptyText}>No collections in {selectedFilter}.</Text>
      ) : (
        visibleCollections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
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
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  pageContent: {
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterRow: {
    // A horizontal list inside a vertical one. marginHorizontal cancels out the
    // page padding so the pills can scroll all the way to the screen edge.
    marginHorizontal: -16,
  },
  filterRowContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterPillSelected: {
    backgroundColor: '#c8c8c8',
  },
  filterText: {
    fontSize: 13,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingTop: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#555555',
  },
});
