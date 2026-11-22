import * as Sharing from 'expo-sharing';
import { useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { BadgeStamp } from '@/components/badge-stamp';
import { ConfettiBurst } from '@/components/confetti-burst';
import { colors, radius, spacing, type } from '@/theme';

// The shared modal body for a badge, used both by BadgeCelebrationHost (a
// brand new badge, with confetti) and by tapping any badge on the Badges
// tab grid (a plain look at one you already have, or a hint for one you
// don't) -- see profile-badges.tsx. Same stamp, same layout, same Share.

type BadgeDetailCardProps = {
  visible: boolean;
  onRequestClose: () => void;
  icon: string;
  name: string;
  description: string;
  level?: number;
  levels?: number[];
  locked: boolean;
  revealed: boolean; // false shows "???" instead of name/description (an unearned secret badge)
  kindLabel?: string; // "New badge" / "Level up" / "Secret badge found" -- the celebration flow only
  kindMuted?: boolean;
  confetti?: 'full' | 'small' | null;
  primaryLabel: string;
  onPrimaryPress: () => void;
  shareable: boolean; // shows Share and captures/shares this same card -- only for badges you've earned
  onSeeAllPress?: () => void;
};

export function BadgeDetailCard({
  visible,
  onRequestClose,
  icon,
  name,
  description,
  level,
  levels,
  locked,
  revealed,
  kindLabel,
  kindMuted,
  confetti,
  primaryLabel,
  onPrimaryPress,
  shareable,
  onSeeAllPress,
}: BadgeDetailCardProps) {
  // react-native-view-shot's captureRef predates the new View ref type, so
  // this stays untyped rather than fighting that mismatch.
  const shareCardRef = useRef<any>(null);

  async function share() {
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch {
      // No share sheet available (e.g. some web browsers) -- nothing to do.
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={styles.backdrop} onPress={onRequestClose} />
      <View style={styles.card}>
        {!!confetti && <ConfettiBurst size={confetti} />}

        {!!kindLabel && <Text style={[styles.kind, kindMuted && styles.kindMuted]}>{kindLabel}</Text>}

        <View style={styles.stampWrap}>
          <BadgeStamp icon={icon} level={level} locked={locked} revealed={revealed} tilted size={96} />
        </View>

        <Text style={[styles.name, locked && styles.textLocked]}>{revealed ? name : '???'}</Text>
        {revealed && <Text style={[styles.description, locked && styles.textLocked]}>{description}</Text>}

        {!!levels && levels.length > 1 && (
          <View style={styles.dots}>
            {levels.map((_, index) => (
              <View key={index} style={[styles.dot, !!level && index < level && styles.dotFilled]} />
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable style={[styles.primaryButton, !shareable && styles.primaryButtonAlone]} onPress={onPrimaryPress}>
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </Pressable>
          {shareable && (
            <Pressable style={styles.secondaryButton} onPress={share}>
              <Text style={styles.secondaryButtonText}>Share</Text>
            </Pressable>
          )}
        </View>

        {!!onSeeAllPress && (
          <Pressable onPress={onSeeAllPress} hitSlop={8}>
            <Text style={styles.seeAllLink}>See all badges</Text>
          </Pressable>
        )}
      </View>

      {/* Off-screen: what Share actually captures, so the card doesn't have
          to be laid out identically to the on-screen pop-up. */}
      {shareable && (
        <View ref={shareCardRef} collapsable={false} style={styles.shareCard}>
          <BadgeStamp icon={icon} level={level} revealed size={110} tilted />
          <Text style={styles.shareName}>{name}</Text>
          <Text style={styles.shareLine}>{description}</Text>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    position: 'absolute',
    left: 32,
    right: 32,
    top: '22%',
    backgroundColor: colors.background,
    borderRadius: radius.card,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  kind: {
    fontSize: type.small,
    fontWeight: '700',
    color: colors.link,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kindMuted: {
    color: colors.textMuted,
  },
  stampWrap: {
    marginVertical: spacing.sm,
  },
  name: {
    fontSize: type.title,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: type.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  textLocked: {
    color: colors.textMuted,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotFilled: {
    backgroundColor: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  primaryButtonAlone: {
    flexGrow: 0,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  seeAllLink: {
    fontSize: type.small,
    color: colors.link,
    marginTop: spacing.xs,
  },
  shareCard: {
    position: 'absolute',
    top: -2000,
    left: 0,
    width: 280,
    padding: spacing.xl,
    backgroundColor: colors.background,
    alignItems: 'center',
    gap: spacing.sm,
  },
  shareName: {
    fontSize: type.heading,
    fontWeight: 'bold',
    color: colors.text,
  },
  shareLine: {
    fontSize: type.small,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
