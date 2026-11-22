import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

// The badge drawn as a passport stamp: a circle with a dashed inner ring and
// an icon in the middle. Reused on the Badges tab grid, the "you earned a
// badge" pop-up, and the share card, so all three read as the same object.
//
// `revealed` is for secret badges: false shows "?" instead of the icon, and
// the caller is expected to swap it to true once (see BadgeCelebration's
// flip). `locked` greys it out for badges you haven't reached yet.

type BadgeStampProps = {
  icon: string;
  level?: number; // shown as a small "Lv 2" tag when > 1
  locked?: boolean;
  revealed?: boolean;
  size?: number;
  tilted?: boolean; // the ~-8deg tilt from the wireframe; off on the grid
};

export function BadgeStamp({ icon, level, locked = false, revealed = true, size = 72, tilted = false }: BadgeStampProps) {
  const ringInset = Math.max(4, Math.round(size * 0.08));

  return (
    <View
      style={[
        styles.outer,
        { width: size, height: size, borderRadius: size / 2 },
        locked && styles.outerLocked,
        tilted && styles.tilted,
      ]}
    >
      <View
        style={[
          styles.innerRing,
          {
            top: ringInset,
            left: ringInset,
            right: ringInset,
            bottom: ringInset,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.icon, { fontSize: size * 0.4 }]}>{revealed ? icon : '?'}</Text>
      </View>

      {!!level && level > 1 && (
        <View style={styles.levelTag}>
          <Text style={styles.levelText}>Lv {level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.fill,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerLocked: {
    backgroundColor: colors.background,
    borderColor: colors.line,
    opacity: 0.6,
  },
  tilted: {
    transform: [{ rotate: '-8deg' }],
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  levelTag: {
    position: 'absolute',
    bottom: -spacing.xs,
    backgroundColor: colors.ink,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  levelText: {
    color: colors.background,
    fontSize: type.small - 2,
    fontWeight: '700',
  },
});
