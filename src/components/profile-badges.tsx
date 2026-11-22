import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BadgeDetailCard } from '@/components/badge-detail-card';
import { BadgeStamp } from '@/components/badge-stamp';
// THEME CODE -- design system. See profile-header.tsx for the convention.
import { colors, radius, spacing, type } from '@/theme';
import { BADGE_DEFINITIONS, useBadgesForProfile } from '@/hooks/use-badges';
import { categoryFor } from '@/utils/place-category';

import type { AuthoredReview } from '@/services/reviews';
import type { TravelGoal } from '@/types/profile';
import type { BadgeDefinition, UserBadge } from '@/types/badge';

// The Badges tab: yearly travel goal progress, a "traveler type" split (e.g.
// Food 55% / Outdoors 25% / Culture 20%), and the real badges from
// src/services/badges.ts (see BadgesSection below). Traveler type and goal
// progress are calculated here each time; nothing about them is stored.

function uniqueCountries(reviews: AuthoredReview[]): number {
  return new Set(reviews.map((review) => review.country)).size;
}

function uniqueCities(reviews: AuthoredReview[]): number {
  return new Set(reviews.map((review) => review.city)).size;
}

export function getTravelerType(reviews: AuthoredReview[]): { category: string; percent: number }[] {
  if (reviews.length === 0) return [];

  const counts = new Map<string, number>();
  for (const review of reviews) {
    const category = categoryFor(review.placeType);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([category, count]) => ({ category, percent: Math.round((count / reviews.length) * 100) }))
    .sort((a, b) => b.percent - a.percent);
}

function progressForGoal(goal: TravelGoal, reviews: AuthoredReview[]): number {
  const reviewsThisYear = reviews.filter((review) => review.createdAt?.startsWith(String(goal.year)));
  if (goal.metric === 'places') return reviewsThisYear.length;
  if (goal.metric === 'countries') return uniqueCountries(reviewsThisYear);
  return uniqueCities(reviewsThisYear);
}

// The real badge grid, from src/services/badges.ts. Everyone's earned
// badges are visible to everyone (except people they've blocked -- the
// table's RLS). On your own profile this also shows what you haven't
// earned yet, greyed out, like a checklist of what's next; on someone
// else's it's just their trophy case -- a wall of "???" and locked icons
// for a stranger's unearned badges isn't useful the way it is for your own.
function EarnedBadges({ profileId, showLocked }: { profileId: string; showLocked: boolean }) {
  const badges = useBadgesForProfile(profileId);
  const [tapped, setTapped] = useState<{ badge: BadgeDefinition; earned?: UserBadge } | null>(null);

  if (badges.isPending) return null;

  const byBadge = new Map((badges.data ?? []).map((row) => [row.badgeId, row]));
  const definitions = showLocked ? BADGE_DEFINITIONS : BADGE_DEFINITIONS.filter((badge) => byBadge.has(badge.id));

  if (definitions.length === 0) {
    return <Text style={styles.empty}>No badges yet.</Text>;
  }

  return (
    <View style={styles.badgeGrid}>
      {definitions.map((badge) => {
        const earned: UserBadge | undefined = byBadge.get(badge.id);
        const locked = !earned;
        const revealed = !badge.secret || !!earned;
        // An unearned secret badge stays a total mystery -- nothing to tap.
        const tappable = revealed;
        return (
          <Pressable
            key={badge.id}
            style={styles.badgeItem}
            disabled={!tappable}
            onPress={() => setTapped({ badge, earned })}
          >
            <BadgeStamp icon={badge.icon} level={earned?.level} locked={locked} revealed={revealed} size={56} />
            <Text style={[styles.badgeLabel, locked && styles.badgeLabelLocked]} numberOfLines={1}>
              {revealed ? badge.name : '???'}
            </Text>
          </Pressable>
        );
      })}

      {!!tapped && (
        <BadgeDetailCard
          visible
          onRequestClose={() => setTapped(null)}
          icon={tapped.badge.icon}
          name={tapped.badge.name}
          description={tapped.badge.description}
          level={tapped.earned?.level}
          levels={tapped.badge.levels}
          locked={!tapped.earned}
          revealed
          confetti={null}
          primaryLabel="Close"
          onPrimaryPress={() => setTapped(null)}
          shareable={!!tapped.earned}
        />
      )}
    </View>
  );
}

type ProfileBadgesProps = {
  reviews: AuthoredReview[];
  goals?: TravelGoal[];
  profileId: string;
  isOwnProfile: boolean;
};

export function ProfileBadges({ reviews, goals, profileId, isOwnProfile }: ProfileBadgesProps) {
  const travelerType = getTravelerType(reviews);

  return (
    <View style={styles.container}>
      <EarnedBadges profileId={profileId} showLocked={isOwnProfile} />

      {reviews.length === 0 ? (
        <Text style={styles.empty}>Post a review to start earning badges.</Text>
      ) : (
        <>
          {goals?.map((goal) => {
            const progress = progressForGoal(goal, reviews);
            const percent = Math.min(100, Math.round((progress / goal.target) * 100));
            return (
              <View key={goal.year} style={styles.goal}>
                <Text style={styles.goalLabel}>
                  {goal.year} goal: {progress}/{goal.target} {goal.metric}
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>
              </View>
            );
          })}

          {travelerType.length > 0 && (
            <View>
              <Text style={styles.sectionLabel}>Traveler type</Text>
              {travelerType.map(({ category, percent }) => (
                <Text key={category} style={styles.travelerTypeRow}>
                  {category} {percent}%
                </Text>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.xl,
  },
  goal: {
    gap: spacing.xs,
  },
  goalLabel: {
    fontSize: type.small,
    fontWeight: '600',
    color: colors.text,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.fill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.ink,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: type.small,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  travelerTypeRow: {
    fontSize: type.small,
    color: colors.textMuted,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badgeItem: {
    width: 72,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeLabel: {
    fontSize: type.small - 2,
    color: colors.text,
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: colors.textMuted,
  },
});
