import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme';

// A one-shot confetti burst for the badge pop-up (BadgeCelebration). Plays
// once on mount; the caller just skips rendering this when
// AccessibilityInfo.isReduceMotionEnabled() is true, per the wireframe.

const PARTICLE_COLORS = [colors.ink, '#2A9D8F', '#E76F51', '#E9C46A', '#3A48E8'];
const FULL_COUNT = 18;
const SMALL_COUNT = 8;

type ConfettiPieceProps = { index: number; total: number };

function ConfettiPiece({ index, total }: ConfettiPieceProps) {
  const progress = useSharedValue(0);

  // Spread evenly in a fan above the stamp, with a little per-piece jitter so
  // it doesn't look like a perfect grid.
  const angle = (index / total) * Math.PI - Math.PI / 2 + (((index * 37) % 10) - 5) * 0.03;
  const distance = 70 + ((index * 53) % 60);
  const spinDegrees = (index * 71) % 360;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
  const delay = (index % 6) * 20;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 650 + (index % 5) * 80, easing: Easing.out(Easing.cubic) }),
    );
    // Runs once per mount -- this piece's spread is fixed by its index.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const x = Math.cos(angle) * distance * progress.value;
    const y = Math.sin(angle) * distance * progress.value + progress.value * progress.value * 36;
    return {
      opacity: 1 - progress.value,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${spinDegrees * progress.value}deg` }],
    };
  });

  return <Animated.View style={[styles.piece, { backgroundColor: color }, style]} />;
}

type ConfettiBurstProps = {
  size?: 'full' | 'small'; // full for new/secret/combo badges, small for level-ups
};

export function ConfettiBurst({ size = 'full' }: ConfettiBurstProps) {
  const count = size === 'small' ? SMALL_COUNT : FULL_COUNT;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: count }, (_, index) => (
        <ConfettiPiece key={index} index={index} total={count} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '28%',
    left: '50%',
    width: 0,
    height: 0,
  },
  piece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
