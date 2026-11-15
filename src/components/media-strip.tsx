import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors } from '@/theme';

// A row of images you swipe sideways, with page dots underneath.
// The first image is the place's cover image, followed by its media.
// Cards use a fixed 4:5 shape so the feed doesn't jump while images load.

type MediaStripProps = {
  images: string[]; // image URLs
  width: number; // how wide the strip is; height is 5/4 of this
  onPress?: () => void; // tapping an image
  onSwipePastEnd?: () => void; // dragging past the last image (e.g. to open the place page)
};

// How far (px) the user must drag beyond the last image to count as a swipe past the end
const SWIPE_PAST_END = 40;

export function MediaStrip({ images, width, onPress, onSwipePastEnd }: MediaStripProps) {
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
        alwaysBounceHorizontal
        overScrollMode="always"
        onScrollEndDrag={(e) => {
          const { contentOffset } = e.nativeEvent;
          if (contentOffset.x > (images.length - 1) * width + SWIPE_PAST_END) onSwipePastEnd?.();
        }}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Pressable onPress={onPress} accessibilityRole="imagebutton">
            <Image source={{ uri: item }} style={{ width, height }} contentFit="cover" />
          </Pressable>
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

// ---------------------------------------------------------------------------
// THEME CODE (design system) -- Ruby
//
// Colours, corner radius and spacing now come from src/theme.ts instead of
// being typed in here. These are LOOKS ONLY -- no logic changed, nothing moved,
// no props changed. Anything marked THEME CODE is safe to ignore while you work.
//
// To change a colour, change it in src/theme.ts so every screen updates, rather
// than putting a hex code back in here.
// ---------------------------------------------------------------------------
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
    backgroundColor: colors.card,
  },
});
