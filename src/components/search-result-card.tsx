import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SearchResult } from '@/types/search-result';

// One row in the search results list. A SearchResult is EITHER a profile
// or a place (see the `kind` field in src/types/search-result.ts), so this
// component checks `result.kind` and renders the matching card.

type SearchResultCardProps = {
  result: SearchResult;
  onPress?: () => void;
};

export function SearchResultCard({ result, onPress }: SearchResultCardProps) {
  if (result.kind === 'profile') {
    const profile = result.data;
    return (
      <Pressable style={styles.row} onPress={onPress}>
        <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
        <View>
          <Text style={styles.title}>{profile.name}</Text>
          <Text>@{profile.username}</Text>
          {/* TODO: show profile.currentCountry as a flag emoji once we know how */}
        </View>
      </Pressable>
    );
  }

  // result.kind === 'place'
  const place = result.data;
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {place.media[0] && <Image source={{ uri: place.media[0] }} style={styles.avatar} />}
      <View>
        <Text style={styles.title}>{place.placeName}</Text>
        <Text>{place.address}</Text>
        <Text>{place.rating} ★</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  title: {
    fontWeight: 'bold',
  },
});
