import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AVATAR_OVERLAP } from '@/components/profile-cover';
// THEME CODE -- design system. See profile-header.tsx for the convention.
import { colors, radius, spacing } from '@/theme';

// Shown while loadProfileData is in flight. Mirrors the real page's shape
// (cover band, avatar overlapping its bottom edge, name/username, a stats
// row) instead of a couple of lines floating in blank space, so loading
// reads as "this page is loading" rather than "this looks different".

export function ProfileSkeleton() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.cover} />
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar} />
      </View>

      <View style={styles.content}>
        <View style={styles.nameLine} />
        <View style={styles.usernameLine} />

        <View style={styles.statsRow}>
          <View style={styles.statBlock} />
          <View style={styles.statBlock} />
          <View style={styles.statBlock} />
        </View>

        <View style={styles.bioLine} />
        <View style={[styles.bioLine, styles.bioLineShort]} />

        <View style={styles.postsRow}>
          <View style={styles.postTile} />
          <View style={styles.postTile} />
          <View style={styles.postTile} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cover: {
    height: 160,
    backgroundColor: colors.fill,
  },
  avatarWrapper: {
    position: 'absolute',
    top: 160 - AVATAR_OVERLAP,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.fill,
    borderWidth: 3,
    borderColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + AVATAR_OVERLAP,
    gap: spacing.sm,
    alignItems: 'center',
  },
  nameLine: {
    width: 140,
    height: 18,
    borderRadius: radius.image,
    backgroundColor: colors.fill,
  },
  usernameLine: {
    width: 90,
    height: 13,
    borderRadius: radius.image,
    backgroundColor: colors.fill,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  statBlock: {
    width: 48,
    height: 32,
    borderRadius: radius.image,
    backgroundColor: colors.fill,
  },
  bioLine: {
    width: '80%',
    height: 13,
    borderRadius: radius.image,
    backgroundColor: colors.fill,
    marginTop: spacing.md,
  },
  bioLineShort: {
    width: '55%',
  },
  postsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.lg,
  },
  postTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.card,
    backgroundColor: colors.fill,
  },
});
