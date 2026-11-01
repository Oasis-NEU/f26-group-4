import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Collection } from '@/types/collection';

// One collection shown as a big card, e.g. "Europe Trip".
// The cover image fills the card and the name sits on top of it.

type CollectionCardProps = {
  collection: Collection;
  onPress?: () => void;
};

export function CollectionCard({ collection, onPress }: CollectionCardProps) {
  // Count the places in this collection plus any inside its sub-collections,
  // so "Europe Trip" shows 4 rather than 0.
  let placeCount = collection.places.length;

  if (collection.subCollections !== undefined) {
    for (const sub of collection.subCollections) {
      placeCount = placeCount + sub.places.length;
    }
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* The cover photo: For now the card is just a colored block 
      I don't know what the cover should be, previews of the places in the 
      collection maybe like* Pinterest?*/}

      {/* Sits on top of the image because of `position: absolute` below */}
      <View style={styles.textArea}>
        <Text style={styles.name}>{collection.name}</Text>
        <Text style={styles.count}>
          {placeCount} {placeCount === 1 ? 'place' : 'places'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 160,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden', // stops the image poking out past the rounded corners
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textArea: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 13,
    color: '#555555',
  },
});
