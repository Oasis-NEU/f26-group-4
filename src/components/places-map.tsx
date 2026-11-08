import { useEffect, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors } from '@/theme';

import { MapImageStack, STACK_SIZE } from '@/components/map-image-stack';
import { MapPlacePreview } from '@/components/map-place-preview';
import type { Place } from '@/types/place';
import { getMapPreviewImages } from '@/utils/map-preview-images';

// Full-screen map with one marker per place. Each marker is a small stack of photos (friends'
// photos first) instead of a pin. Uses react-native-maps: Apple Maps on iOS, Google Maps on
// Android. If it isn't available, this shows a plain list of places instead, so the Map tab
// never crashes.
// It holds no data itself: the screen passes in the places and hears back which marker was tapped.

// react-native-maps may not be available (e.g. on web), so it is loaded inside try/catch
let RNMaps: typeof import('react-native-maps') | null = null;
if (Platform.OS !== 'web') {
  try {
    // require() instead of import, so a missing native module can be caught here
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    RNMaps = require('react-native-maps');
  } catch {
    RNMaps = null;
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
  friendUsernames?: string[]; // whose photos go on top of each stack
  camera: MapCamera; // where the map is looking; change it to move the map
  onSelectPlace: (placeId: string | null) => void; // a pin was tapped, or null when the map was
  onViewDetails: (placeId: string) => void; // used by the fallback list
};

export function PlacesMap({ places, friendUsernames = [], camera, onSelectPlace, onViewDetails }: PlacesMapProps) {
  const MapView = RNMaps?.default;
  const Marker = RNMaps?.Marker;
  const mapRef = useRef<InstanceType<NonNullable<typeof MapView>>>(null);

  // Move the map when the screen changes the camera (e.g. after a search)
  useEffect(() => {
    mapRef.current?.animateCamera(
      { center: { latitude: camera.latitude, longitude: camera.longitude }, zoom: camera.zoom },
      { duration: 500 },
    );
  }, [camera]);

  if (!MapView || !Marker) {
    return (
      <FlatList
        data={places}
        keyExtractor={(place) => place.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.notice}>{"The map isn't available here, so here are the places."}</Text>}
        renderItem={({ item }) => <MapPlacePreview place={item} onViewDetails={() => onViewDetails(item.id)} />}
      />
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialCamera={{
        center: { latitude: camera.latitude, longitude: camera.longitude },
        zoom: camera.zoom,
        heading: 0,
        pitch: 0,
      }}
      onPress={() => onSelectPlace(null)}
    >
      {/* A place posted without a location has nowhere to go on the map. */}
      {places
        .filter((place) => place.latitude !== undefined && place.longitude !== undefined)
        .map((place) => (
        <StackMarker
          key={place.id}
          Marker={Marker}
          place={place}
          images={getMapPreviewImages(place, friendUsernames)}
          onPress={() => onSelectPlace(place.id)}
        />
      ))}
    </MapView>
  );
}

// One marker. Android draws a marker's view once into a bitmap, so it keeps watching the view
// until the photo has loaded, then stops (watching all the time would make the map slow).
function StackMarker({
  Marker,
  place,
  images,
  onPress,
}: {
  Marker: NonNullable<typeof RNMaps>['Marker'];
  place: Place;
  images: string[];
  onPress: () => void;
}) {
  const [tracking, setTracking] = useState(true);

  return (
    <Marker
      // PlacesMap only passes places that have coordinates.
      coordinate={{ latitude: place.latitude!, longitude: place.longitude! }}
      onPress={(e) => {
        e.stopPropagation(); // so the map's own onPress doesn't immediately close the card
        onPress();
      }}
      tracksViewChanges={tracking}
      anchor={{ x: 0.5, y: 0.5 }}
      accessibilityLabel={place.name}
    >
      {images.length > 0 ? (
        <MapImageStack images={images} onLoad={() => setTracking(false)} />
      ) : (
        <Text style={{ fontSize: STACK_SIZE / 2 }}>📍</Text>
      )}
    </Marker>
  );
}

// ---------------------------------------------------------------------------
// THEME CODE (design system) -- Ruby
//
// Colours, corner radius and spacing now come from src/theme.ts instead of
// being typed in here. These are LOOKS ONLY -- no logic changed, nothing moved,
// no props changed. Anything marked THEME CODE is safe to ignore while you work.
//
// To change a colour, change it in src/theme.ts so every screen updates, rather
// than putting a hex code back in here.
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  list: {
    padding: 12,
    gap: 12,
  },
  notice: {
    color: colors.textMuted,
  },
});
