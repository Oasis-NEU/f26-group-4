import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SavedPlaceRow } from '@/components/saved-place-row';
import { getCollection } from '@/services/collections';
import { Collection } from '@/types/collection';

// Inside one collection, e.g. /collection/col_europe.
// Shows the collection's own places, and its sub-collections as labelled groups.

export default function CollectionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCollection(id).then((result) => {
      setCollection(result);
      setIsLoading(false);
    });
    // TODO: reload when coming back to this screen (useFocusEffect), in case a place
    // was un-saved on the Place page.
  }, [id]);

  function openPlace(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } });
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (collection === null) {
    return (
      <View style={styles.centered}>
        <Text>This collection no longer exists.</Text>
      </View>
    );
  }

  // Sub-collections are only shown one level deep, even though the type allows
  // deeper nesting. Limiting the depth is a rule, so it belongs in the code that
  // creates collections, not in the type.
  const subCollections = collection.subCollections ?? [];

  const isEmpty = collection.places.length === 0 && subCollections.length === 0;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      {/* Puts the collection's name in the bar at the top of the screen,
          instead of the route name. */}
      <Stack.Screen options={{ title: collection.name }} />

      {isEmpty && <Text style={styles.emptyText}>No places in this collection yet.</Text>}

      {/* Each sub-collection gets a heading and its own list of rows */}
      {subCollections.map((sub) => (
        <View key={sub.id} style={styles.group}>
          <Text style={styles.groupHeading}>{sub.name}</Text>

          {sub.places.map((place) => (
            <SavedPlaceRow
              key={place.id}
              place={place}
              onPress={() => openPlace(place.id)}
              onRemove={() => {
                // TODO: actually remove the place once collections can be edited.
                // The plan is to show a short "Removed. Undo" message rather than
                // asking "are you sure?" first.
              }}
            />
          ))}
        </View>
      ))}

      {/* Places saved straight into this collection, not into a sub-collection */}
      {collection.places.map((place) => (
        <SavedPlaceRow
          key={place.id}
          place={place}
          onPress={() => openPlace(place.id)}
          onRemove={() => {
            // TODO: same as above.
          }}
        />
      ))}
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
  group: {
    gap: 12,
  },
  groupHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingTop: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#555555',
  },
});
