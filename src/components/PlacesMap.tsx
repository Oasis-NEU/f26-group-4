import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';

import { MapPlacePreview } from '@/components/MapPlacePreview';
import type { Place } from '@/types/place';

// Full-screen map with one pin per place. Uses expo-maps: Apple Maps on iOS, Google Maps on
// Android. expo-maps doesn't work on web or in Expo Go (it needs a development build), so it is
// loaded inside try/catch. If it isn't available, this shows a plain list of places instead,
// so the Map tab never crashes.
// It holds no data itself: the screen passes in the places and hears back which pin was tapped.

// expo-maps is alpha, so its API may change when we update the SDK
let ExpoMaps: typeof import('expo-maps') | null = null;
if (Platform.OS !== 'web') {
  try {
    ExpoMaps = require('expo-maps');
  } catch {
    ExpoMaps = null;
  }
}

export type MapCamera = {
  latitude: number;
  longitude: number;
  zoom: number;
};

// Starts zoomed all the way out so you see the globe
export const WORLD_CAMERA: MapCamera = { latitude: 20, longitude: 0, zoom: 1 };

type PlacesMapProps = {
  places: Place[];
  camera: MapCamera; // where the map is looking; change it to move the map
  onSelectPlace: (placeId: string | null) => void; // a pin was tapped, or null when the map was
  onViewDetails: (placeId: string) => void; // used by the fallback list
};

export function PlacesMap({ places, camera, onSelectPlace, onViewDetails }: PlacesMapProps) {
  const MapView =
    Platform.OS === 'ios' ? ExpoMaps?.AppleMaps.View : Platform.OS === 'android' ? ExpoMaps?.GoogleMaps.View : null;

  if (!MapView) {
    return (
      <FlatList
        data={places}
        keyExtractor={(place) => place.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.notice}>The map isn't available here, so here are the places.</Text>}
        renderItem={({ item }) => <MapPlacePreview place={item} onViewDetails={() => onViewDetails(item.id)} />}
      />
    );
  }

  return (
    <MapView
      style={styles.map}
      cameraPosition={{
        coordinates: { latitude: camera.latitude, longitude: camera.longitude },
        zoom: camera.zoom,
      }}
      markers={places.map((place) => ({
        id: place.id,
        coordinates: { latitude: place.latitude, longitude: place.longitude },
        title: place.name,
      }))}
      onMarkerClick={(marker: { id?: string }) => onSelectPlace(marker.id ?? null)}
      onMapClick={() => onSelectPlace(null)}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  list: {
    padding: 12,
    gap: 12,
  },
  notice: {
    color: '#666',
  },
});
