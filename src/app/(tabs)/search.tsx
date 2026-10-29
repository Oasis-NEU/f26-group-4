import { StyleSheet, Text, View } from 'react-native';

// Search tab: find other users and places.
// Pieces to build it from:
//   Components: SearchBar (@/components/search-bar), SearchResultCard (@/components/search-result-card)
//   Types: SearchResult (@/types/search-result)
export default function SearchPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text>Not built yet. This page lives in src/app/(tabs)/search.tsx.</Text>
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
