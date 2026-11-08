import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PlaceCard } from '@/components/place-card';
import { SavedPlaceRow } from '@/components/saved-place-row';
import { ViewToggle } from '@/components/ui';
import { useCity, useCityPlaces } from '@/hooks/use-cities';
import { colors, spacing, type } from '@/theme';

// Everything we have in one city. This is what an Explore tile opens.
//
// The city comes in through the URL: /city/florence-it. `id` below is that part
// of the address, and it has to match the [id] in this file's name.

// The two ways of looking at the same places. `as const` keeps them as the
// exact strings "feed" and "list" rather than widening them to `string`, which
// is what lets ViewToggle know which labels it needs.
const VIEWS = ['feed', 'list'] as const;
type ViewMode = (typeof VIEWS)[number];

export default function CityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // PlaceCard takes the card width and works its own media height out from it.
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  const [view, setView] = useState<ViewMode>('feed');

  // The city and its places are two separate requests, fired together.
  const cityQuery = useCity(id);
  const placesQuery = useCityPlaces(id);
  const city = cityQuery.data;

  // Put the city name in the navigation bar at the top instead of "City".
  // useLayoutEffect rather than useEffect so the title is set before the screen
  // draws, otherwise you see the old title flash first.
  useLayoutEffect(() => {
    navigation.setOptions({ title: city?.name ?? '' });
  }, [navigation, city]);

  // Pull to refresh, with a local flag (isRefetching is also true for background refetches).
  const [refreshing, setRefreshing] = useState(false);
  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([cityQuery.refetch(), placesQuery.refetch()]);
    setRefreshing(false);
  }

  function openPlace(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } });
  }

  if (cityQuery.isPending || placesQuery.isPending) {
    return <ActivityIndicator style={styles.center} />;
  }

  if (cityQuery.isError || placesQuery.isError || !city) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We don&apos;t have anything in this city yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        // One list for both views. Only the row changes, so switching views
        // keeps the scroll position and doesn't rebuild the whole screen.
        data={placesQuery.data}
        keyExtractor={(place) => place.id}
        // The list view needs gaps and side margins; the feed is full-bleed
        // cards, like the home feed, so it gets neither.
        contentContainerStyle={view === 'list' ? styles.listContent : undefined}
        renderItem={({ item }) =>
          view === 'feed' ? (
            <PlaceCard
              place={item}
              width={width}
              onPress={() => openPlace(item.id)}
            />
          ) : (
            <SavedPlaceRow place={item} onPress={() => openPlace(item.id)} />
          )
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.country}>{city.country}</Text>
            <Text style={styles.summary}>
              {city.placeCount} {city.placeCount === 1 ? 'place' : 'places'} · {city.averageRating.toFixed(1)} average
            </Text>
            <ViewToggle
              value={view}
              options={VIEWS}
              onChange={setView}
              labels={{ feed: 'Feed', list: 'List' }}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.message}>Nothing here yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  country: {
    fontWeight: '500',
    fontSize: type.tiny,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  summary: {
    fontSize: type.body,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  message: {
    fontSize: type.body,
    color: colors.textMuted,
  },
});
