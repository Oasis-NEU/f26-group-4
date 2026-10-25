import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PlaceDetails } from '@/components/place-details';
import { mockPlace } from '@/types/place';

// Place page: opens on top of the tabs when someone taps a place.
// The [id] in the file name is filled in from the link, e.g. /place/place_001 gives id "place_001".
export default function PlacePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // TODO: get the place from a places service instead (see src/services/template-service.ts).
  const place = id === mockPlace.id ? mockPlace : null;

  if (!place) {
    return (
      <View style={styles.container}>
        <Text>Place not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PlaceDetails place={place} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
