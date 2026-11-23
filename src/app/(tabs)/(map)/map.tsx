import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Keyboard, Platform, StyleSheet, Text, View } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, TOP_BUFFER } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapPlacePreview } from '@/components/map-place-preview';
import { PlacesMap, WORLD_CAMERA, type MapCamera } from '@/components/places-map';
import { SearchFilterBar } from '@/components/search-filter-bar';
import { useFriendUsernames } from '@/hooks/use-follows';
import { useFilterOptions, usePlaces } from '@/hooks/use-places';
import { useReviewsByUser } from '@/hooks/use-reviews';
import { useUserId } from '@/hooks/use-session';
import type { Place } from '@/types/place';

// Map: one photo-stack marker per place. Tapping a marker shows a preview card on this page, and the card's
// "View details" button opens Place details. See the Map page in the docs.

const NO_PLACES: Place[] = [];
const NO_USERNAMES: string[] = [];

// Where the map looks when a country is searched: the middle of that country's places,
// zoomed so they all fit (a single place gets a fixed country-sized zoom).
function countryCamera(places: Place[]): MapCamera | null {
  const located = places.filter((p) => p.latitude !== undefined && p.longitude !== undefined);
  if (located.length === 0) return null;
  const lats = located.map((p) => p.latitude!);
  const lngs = located.map((p) => p.longitude!);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const span = Math.max(maxLat - minLat, maxLng - minLng) * 1.6;
  const zoom = span < 1 ? 5 : Math.min(7, Math.max(3, Math.log2(360 / span)));
  return { latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2, zoom };
}

export default function MapScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Search text and filters; changing any of them loads the matching places, which hides pins that don't match
  const [query, setQuery] = useState('');
  const [placeTypes, setPlaceTypes] = useState<string[]>([]);
  const [suitedFor, setSuitedFor] = useState<string[]>([]);
  const filterOptions = useFilterOptions();

  const [onlyMine, setOnlyMine] = useState(false);

  const placesQuery = usePlaces({ query, placeTypes, suitedFor });
  // Same filters without the search text. Place search only matches names and cities, so this is
  // how a typed country is found.
  const allPlacesQuery = usePlaces({ placeTypes, suitedFor });
  const allPlaces = allPlacesQuery.data ?? NO_PLACES;

  // "My posts": the places the signed-in user has reviewed.
  const userId = useUserId();
  const myReviews = useReviewsByUser(userId).data;
  const myPlaceIds = useMemo(() => new Set((myReviews ?? []).map((r) => r.placeID)), [myReviews]);

  // If the search text is a country (exact name first, then a start of one), show that country's places.
  const searchedCountryPlaces = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (text.length < 2) return null;
    const countries = [...new Set(allPlaces.map((p) => p.country))].filter(Boolean);
    const match =
      countries.find((c) => c.toLowerCase() === text) ?? countries.find((c) => c.toLowerCase().startsWith(text));
    return match ? allPlaces.filter((p) => p.country === match) : null;
  }, [allPlaces, query]);

  const matched = searchedCountryPlaces ?? placesQuery.data ?? NO_PLACES;
  const places = useMemo(
    () => (onlyMine ? matched.filter((p) => myPlaceIds.has(p.id)) : matched),
    [matched, onlyMine, myPlaceIds],
  );
  // The people the signed-in user follows, so their photos come first on the pins.
  const friendUsernames = useFriendUsernames().data ?? NO_USERNAMES;

  // Searching a country zooms to it; any other search moves the map to the first match;
  // clearing the search zooms back out.
  const camera = useMemo<MapCamera>(() => {
    if (query.trim() && searchedCountryPlaces) {
      const country = countryCamera(searchedCountryPlaces);
      if (country) return country;
    }
    const first = places[0];
    const hasCoordinates = first?.latitude !== undefined && first?.longitude !== undefined;
    return query.trim() && hasCoordinates
      ? { latitude: first.latitude!, longitude: first.longitude!, zoom: 10 }
      : WORLD_CAMERA;
  }, [places, query, searchedCountryPlaces]);

  // When the keyboard opens it covers the bottom of the map, so the preview card is lifted by
  // however much of the map area the keyboard covers.
  const mapAreaRef = useRef<ComponentRef<typeof View>>(null);
  const [keyboardLift, setKeyboardLift] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      mapAreaRef.current?.measureInWindow((_x, y, _w, height) => {
        setKeyboardLift(Math.max(0, y + height - e.endCoordinates.screenY));
      });
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardLift(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // The card closes by itself if its place was filtered out.
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
        onlyMine={onlyMine}
        onChangeOnlyMine={setOnlyMine}
        placeTypeOptions={filterOptions.placeTypes}
        suitedForOptions={filterOptions.suitedFor}
      />

      {/* The map shows right away; pins are added when they arrive */}
      <View ref={mapAreaRef} style={styles.mapArea} collapsable={false}>
        <PlacesMap places={places} friendUsernames={friendUsernames} camera={camera} onSelectPlace={setSelectedId} onViewDetails={openDetails} />

        {!placesQuery.isPending && places.length === 0 && (
          <View style={styles.banner}>
            <Text>No places match</Text>
          </View>
        )}

        {selected && (
          <View style={[styles.preview, { bottom: 12 + keyboardLift }]}>
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
  screen: {
    paddingTop: TOP_BUFFER,
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
    backgroundColor: colors.background,
  },
  preview: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
});
