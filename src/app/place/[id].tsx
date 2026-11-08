import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PlaceDetails } from '@/components/place-details';
import { getPlace } from '@/services/places';
import { Place } from '@/types/place';

// Place page: opens on top of the tabs when someone taps a place.
// The [id] in the file name is filled in from the link, e.g. /place/place_001 gives id "place_001".
//
// This screen's job is to FIND the place. Showing it is PlaceDetails' job.

export default function PlacePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // The place we're showing. null means "we don't have one".
  const [place, setPlace] = useState<Place | null>(null);
  // Starts true because we start out fetching.
  const [isLoading, setIsLoading] = useState(true);

  // Runs when the screen opens, and again if the id in the link changes.
  useEffect(() => {
    getPlace(id).then((result) => {
      setPlace(result);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (place === null) {
    return (
      <View style={styles.centered}>
        <Text>Place not found.</Text>
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
