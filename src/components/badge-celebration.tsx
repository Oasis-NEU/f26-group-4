import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

import { BadgeDetailCard } from '@/components/badge-detail-card';
import { BADGE_DEFINITIONS, useCheckBadges, useMarkBadgeSeen, useUnseenBadges } from '@/hooks/use-badges';
import { useUserId } from '@/hooks/use-session';

// Mounted once near the app's root (src/app/_layout.tsx), so it can pop up
// over whatever screen you're on -- not just the Profile tab. See
// docs/data-layer.md ("Badges") for the full plan.
//
// Checks for newly-earned badges whenever the app opens or comes back to the
// foreground. Most badges are also checked right after the action that
// earns them (see useCreatePost, useUpdateProfile, useCreateCollection) --
// this foreground check is the fallback for everything else, and the only
// way Crowd Favorite (earned by someone else liking your posts) is ever
// noticed at all.
export function BadgeCelebrationHost() {
  const userId = useUserId();
  const unseen = useUnseenBadges();
  const checkBadges = useCheckBadges();
  const markSeen = useMarkBadgeSeen();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [revealed, setRevealed] = useState(true);
  // Tracks which badge/level is currently on screen, so a change can be
  // noticed and reacted to during render (see the "adjusting state" block
  // below) instead of with a setState call inside an effect's body.
  const [shownKey, setShownKey] = useState<string | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!userId) return;
    checkBadges.mutate();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') checkBadges.mutate();
    });
    return () => subscription.remove();
    // Only re-run if the signed-in user changes -- checkBadges itself is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const current = unseen.data?.[0];
  const remaining = unseen.data?.length ?? 0;
  const definition = current ? BADGE_DEFINITIONS.find((badge) => badge.id === current.badgeId) : undefined;
  const key = current ? `${current.badgeId}:${current.level}` : null;

  // A new badge to show: start it hidden if it's secret, revealed otherwise.
  // The delayed flip-to-revealed for secret badges happens in the effect
  // below, which only ever sets state from a timeout callback, not
  // synchronously in the effect body.
  if (key !== shownKey) {
    setShownKey(key);
    setRevealed(!definition?.secret);
  }

  useEffect(() => {
    if (!current || !definition) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!definition.secret || reduceMotion) return;
    const timeout = setTimeout(() => setRevealed(true), 700);
    return () => clearTimeout(timeout);
    // Keyed on `key`, not `current`/`definition` directly, so this only
    // re-runs when the badge actually on screen changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduceMotion]);

  if (!current || !definition) return null;

  const isLevelUp = current.level > 1;
  const kindLabel = definition.secret && current.level === 1 ? 'Secret badge found' : isLevelUp ? 'Level up' : 'New badge';

  function dismiss() {
    markSeen.mutate(current!.badgeId);
  }

  function seeAllBadges() {
    markSeen.mutate(current!.badgeId);
    router.push('/profile');
  }

  return (
    <BadgeDetailCard
      visible
      onRequestClose={dismiss}
      icon={definition.icon}
      name={definition.name}
      description={definition.description}
      level={current.level}
      levels={definition.levels}
      locked={false}
      revealed={revealed}
      kindLabel={kindLabel}
      kindMuted={isLevelUp}
      confetti={reduceMotion ? null : isLevelUp ? 'small' : 'full'}
      primaryLabel={remaining > 1 ? 'Next' : 'Nice!'}
      onPrimaryPress={dismiss}
      shareable
      onSeeAllPress={seeAllBadges}
    />
  );
}
