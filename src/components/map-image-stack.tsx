import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

// A small stack of photos used as a map marker. The first image is on top; the others sit
// behind it, a little higher and tilted, so part of each one shows above and to the side.
// It only draws; the map handles taps.

export const STACK_SIZE = 56; // the top photo's width and height
const PEEK = 7; // how much of each photo behind shows above the one in front

type MapImageStackProps = {
  images: string[]; // first = top of the stack (at most 3 are shown)
  onLoad?: () => void; // the top image finished loading (markers need this to redraw)
};

export function MapImageStack({ images, onLoad }: MapImageStackProps) {
  const shown = images.slice(0, 3);
  const height = STACK_SIZE + PEEK * 2;
  const width = STACK_SIZE + PEEK * 3;

  return (
    <View style={{ width, height }}>
      {/* Draw the back photo first so the front ones land on top of it */}
      {[...shown].reverse().map((uri, reversedIndex) => {
        const depth = shown.length - 1 - reversedIndex; // 0 = front photo
        const tilt = [-6, 6, 14][depth] ?? 14; // front leans left, the ones behind fan out to the right
        return (
          <Image
            key={`${depth}-${uri}`}
            source={{ uri }}
            contentFit="cover"
            onLoad={depth === 0 ? onLoad : undefined}
            style={[
              styles.photo,
              {
                top: PEEK * 2 - depth * PEEK,
                left: PEEK / 2 + depth * 3,
                transform: [{ rotate: `${tilt}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    position: 'absolute',
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#ddd',
  },
});
