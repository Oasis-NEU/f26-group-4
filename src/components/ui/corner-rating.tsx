import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, type } from '@/theme';

// The small rating that sits in the corner of a photo or a thumbnail.
// Always a white pill with a pink star, because it has to stay readable on top
// of a photo we haven't seen yet.
//
// This is NOT the same thing as <RatingBadge>. That one comes in three colours
// because it has a label telling you which rating it is. This one has no room
// for a label, so it's always the average and always looks the same.
//
// The parent needs `position: 'relative'` for this to sit on top of it.
//
//   <View style={{ position: 'relative' }}>
//     <Image ... />
//     <CornerRating rating={4.6} />
//   </View>

type CornerRatingProps = {
  rating: number;
  position?: 'topRight' | 'bottomLeft';
};

export function CornerRating({ rating, position = 'bottomLeft' }: CornerRatingProps) {
  return (
    <View style={[styles.badge, position === 'topRight' ? styles.topRight : styles.bottomLeft]}>
      <Text style={styles.star}>★</Text>
      <Text style={styles.text}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.cornerBadgeFill,
    borderRadius: radius.rating,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  topRight: {
    top: 8,
    right: 8,
  },
  bottomLeft: {
    bottom: 4,
    left: 4,
  },
  star: {
    fontSize: type.tiny,
    color: colors.cornerBadgeStar,
  },
  text: {
    fontWeight: '600',
    fontSize: type.tiny,
    color: colors.cornerBadgeText,
  },
});
