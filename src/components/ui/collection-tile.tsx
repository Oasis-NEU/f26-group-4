import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, gradients, radius, spacing, type } from '@/theme';

// A collection shown as a gradient tile: "🏔️ Mountains in Italy".
//
// The gradient is a WASH over white, not a solid colour -- that's why the
// colours in theme.ts have an alpha on them. It runs left to right so the
// photo on the right sits on the pale end and stays readable.
//
// Type sizes here are deliberately the opposite of what you'd expect: the
// title is the LIGHTER weight and the details line underneath is heavier and
// bigger than a caption normally would be. It stops a list of tiles shouting.
//
//   <CollectionTile name="Mountains in Italy" details="6 places · Dolomites" index={0} />

type CollectionTileProps = {
  name: string;
  details: string;
  index?: number; // which gradient to use -- see below
  emoji?: string;
  image?: string;
  onPress?: () => void;
};

export function CollectionTile({
  name,
  details,
  index = 0,
  emoji,
  image,
  onPress,
}: CollectionTileProps) {
  // There are three gradients. `%` wraps back round to the start, so a list of
  // five tiles goes 1, 2, 3, 1, 2 instead of running out.
  const gradient = gradients[index % gradients.length];

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[gradient[0], gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }} // left to right. {x:1,y:1} would make it diagonal.
        style={styles.tile}
      >
        <View style={styles.text}>
          <Text style={styles.name}>
            {emoji !== undefined ? emoji + ' ' : ''}
            {name}
          </Text>
          <Text style={styles.details}>{details}</Text>
        </View>

        {image !== undefined && (
          <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 152,
    borderRadius: radius.collection,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  text: {
    flex: 1, // takes the leftover space so the photo keeps its size
    gap: 6,
  },
  name: {
    fontWeight: '500',
    fontSize: 21,
    lineHeight: 26,
    color: colors.text,
  },
  details: {
    fontWeight: '600',
    fontSize: type.label,
    lineHeight: 18,
    color: colors.text,
  },
  image: {
    width: 100,
    height: '100%',
    borderRadius: radius.card,
  },
});
