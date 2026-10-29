import { StyleSheet, Text, View } from 'react-native';

// Map tab: pins for the places people have been.
// Pieces to build it from:
//   Components: MapPin (@/components/map-pin)
//   Types: Map (types.ts), Place (@/types/place)
export default function MapPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map</Text>
      <Text>Not built yet. This page lives in src/app/(tabs)/map.tsx.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
