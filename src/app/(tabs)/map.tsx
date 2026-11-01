import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapPlacePreview } from '@/components/map-place-preview';
import { PlacesMap, WORLD_CAMERA, type MapCamera } from '@/components/places-map';
import { SearchFilterBar } from '@/components/search-filter-bar';
import { getPlaces, PLACE_TYPES, SUITED_FOR } from '@/services/places';
import type { Place } from '@/types/place';

// Map: one pin per place. Tapping a pin shows a preview card on this page, and the card's
// "View details" button opens Place details. See the Map page in the docs.

export default function MapScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [camera, setCamera] = useState<MapCamera>(WORLD_CAMERA);

  // Search text and filters; changing any of them re-fetches, which hides pins that don't match
  const [query, setQuery] = useState('');
  const [placeTypes, setPlaceTypes] = useState<string[]>([]);
  const [suitedFor, setSuitedFor] = useState<string[]>([]);

  useEffect(() => {
    // `ignore` stops an older, slower request from overwriting a newer one while typing
    let ignore = false;
    getPlaces({ query, placeTypes, suitedFor })
      .then((result) => {
        if (ignore) return;
        setPlaces(result);
        // Searching moves the map to the first match; clearing the search zooms back out
        const first = result[0];
        setCamera(query.trim() && first ? { latitude: first.latitude, longitude: first.longitude, zoom: 10 } : WORLD_CAMERA);
        // Close the card if its place was filtered out
        setSelectedId((id) => (result.some((p) => p.id === id) ? id : null));
      })
      .catch(() => !ignore && setPlaces([]))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [query, placeTypes, suitedFor]);

  const selected = places.find((p) => p.id === selectedId);

  function openDetails(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } });
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
      />

      {/* The map shows right away; pins are added when they arrive */}
      <View style={styles.mapArea}>
        <PlacesMap places={places} camera={camera} onSelectPlace={setSelectedId} onViewDetails={openDetails} />

        {!loading && places.length === 0 && (
          <View style={styles.banner}>
            <Text>No places match</Text>
          </View>
        )}

        {selected && (
          <View style={styles.preview}>
            <MapPlacePreview
              place={selected}
              onViewDetails={() => openDetails(selected.id)}
              onClose={() => setSelectedId(null)}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapArea: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  preview: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
});
