import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

// A row of images you swipe sideways, with page dots underneath.
// The first image is the place's cover image, followed by its media.
// Cards use a fixed 4:5 shape so the feed doesn't jump while images load.

type MediaStripProps = {
  images: string[]; // image URLs
  width: number; // how wide the strip is; height is 5/4 of this
};

export function MediaStrip({ images, width }: MediaStripProps) {
  const [page, setPage] = useState(0);
  const height = width * 1.25;

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(uri, index) => `${index}-${uri}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width, height }} contentFit="cover" />
        )}
      />
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
});
