import { StyleSheet, Text, View } from 'react-native';

import { borderWidth, colors, radius, spacing, type } from '@/theme';

// The star rating badge. There are three kinds and they look DIFFERENT on
// purpose, so you can tell them apart at a glance without reading the label:
//
//   average - grey pill, grey star.      "what everyone thinks"
//   friends - white with a PINK OUTLINE. "what your friends think"
//   forYou  - pale blue, blue star.      "what the app thinks you'll think"
//
// The friends one is the only outlined thing in the entire app, which is what
// makes your eye land on it first. That's deliberate -- friends' opinions are
// the whole point of Oasis.
//
//   <RatingBadge variant="friends" rating={4.8} />
//   <RatingBadge variant="average" rating={4.6} showLabel={false} />

type RatingBadgeProps = {
  variant: 'average' | 'friends' | 'forYou';
  rating: number;
  showLabel?: boolean; // the small word under the number. Off inside tight spaces.
};

// The word under each number.
const LABELS = {
  average: 'Avg',
  friends: 'Friends',
  forYou: 'You',
};

export function RatingBadge({ variant, rating, showLabel = true }: RatingBadgeProps) {
  // Pick the three styles that go with this variant. Written out as plain ifs
  // rather than a lookup object so it's obvious what each one gets.
  let boxStyle = styles.boxAverage;
  let starStyle = styles.starAverage;
  let textStyle = styles.textDark;

  if (variant === 'friends') {
    boxStyle = styles.boxFriends;
    starStyle = styles.starFriends;
  }

  if (variant === 'forYou') {
    boxStyle = styles.boxForYou;
    starStyle = styles.starForYou;
    textStyle = styles.textBlue;
  }

  return (
    <View style={[styles.box, boxStyle]}>
      <Text style={[styles.number, textStyle]}>
        {/* Only the ★ gets the colour. The number stays dark so it's readable. */}
        <Text style={starStyle}>★</Text> {rating.toFixed(1)}
      </Text>
      {showLabel && <Text style={[styles.label, textStyle]}>{LABELS[variant]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.rating,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  boxAverage: {
    backgroundColor: colors.ratingAverageFill,
  },
  boxFriends: {
    backgroundColor: colors.ratingFriendsFill,
    borderWidth: borderWidth.ratingBadge,
    borderColor: colors.ratingFriendsBorder,
  },
  boxForYou: {
    backgroundColor: colors.ratingForYouFill,
  },
  number: {
    fontWeight: '600',
    fontSize: type.label,
  },
  label: {
    fontSize: 10,
  },
  textDark: {
    color: colors.text,
  },
  textBlue: {
    color: colors.ratingForYouText,
  },
  starAverage: {
    color: colors.starAverage,
  },
  starFriends: {
    color: colors.starFriends,
  },
  starForYou: {
    color: colors.starForYou,
  },
});
