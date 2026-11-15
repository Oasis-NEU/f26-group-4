import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PlaceDetails } from '@/components/place-details';
import { usePlace } from '@/hooks/use-places';

// Place page: opens on top of the tabs when someone taps a place.
// The [id] in the file name is filled in from the link, e.g. /place/place_001 gives id "place_001".
//
// This screen's job is to FIND the place. Showing it is PlaceDetails' job.

export default function PlacePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Loads when the screen opens, and again if the id in the link changes.
  const { data: place, isPending, isError } = usePlace(id);

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !place) {
    return (
      <View style={styles.centered}>
        <Text>{isError ? "Couldn't load this place." : 'Place not found.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hides the navigation bar at the top, because PlaceDetails draws its own
          Back button (that's how my wireframe has it). */}
      <Stack.Screen options={{ headerShown: false }} />
      <PlaceDetails place={place} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
