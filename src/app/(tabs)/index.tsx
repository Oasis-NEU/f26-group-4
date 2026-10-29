import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// Feed tab: the first screen people see. Shows recent posts from other travelers.
// Pieces to build it from:
//   Components: FeedItem (@/components/feed-item), MediaPost, PlaceTag
//   Types: Post (types.ts)
export default function FeedPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed</Text>
      <Text>Not built yet. This page lives in src/app/(tabs)/index.tsx.</Text>

      {/* Example of opening a place page. Feed posts will link to their place like this. */}
      <Link href="/place/place_001" style={styles.link}>
        Open an example place
      </Link>
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
  link: {
    marginTop: 20,
    color: '#0066CC',
    fontSize: 16,
  },
});
