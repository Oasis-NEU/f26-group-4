// Badges: rules live here, in code (docs/data-layer.md, "Badges"). What's
// stored in public.user_badges is only which badge/level you've reached and
// whether its pop-up has shown yet -- never the rule itself.
//
// checkBadges() re-runs every rule against your current data and upserts
// anything newly earned or levelled up. It's called from the mutations that
// can earn something (useCreatePost, useUpdateProfile, useCreateCollection)
// and once when the app comes to the foreground, which is also the only way
// Crowd Favorite is ever noticed -- it's earned by other people liking your
// posts, not by anything you do yourself.

import { currentUserId, supabase } from '@/lib/supabase';
import { categoryFor } from '@/utils/place-category';

import { getCollectionsForProfile } from './collections';
import { getFollowingIds } from './follows';
import { getProfile } from './users';

import type { BadgeContext, BadgeDefinition, BadgeReview, UserBadge } from '@/types/badge';

type BadgeReviewRow = {
  created_at: string;
  body: string | null;
  like_count: number | null;
  place: {
    place_type: string;
    latitude: number | null;
    city_id: string;
    city: { country: string } | null;
  } | null;
  media: { id: string }[];
};

type GoalRow = {
  year: number;
  metric: 'places' | 'countries' | 'cities';
  target: number;
};

async function getBadgeContext(userId: string): Promise<BadgeContext> {
  const [reviewsResult, locationResult, goalsResult, collections, profile, followingIds] = await Promise.all([
    supabase
      .from('reviews')
      .select(
        'created_at, body, like_count, place:places(place_type, latitude, city_id, city:cities(country)), media:review_media(id)',
      )
      .eq('author_id', userId),
    supabase.from('profile_locations').select('home_city_id').eq('user_id', userId).maybeSingle(),
    supabase.from('travel_goals').select('year, metric, target').eq('user_id', userId),
    getCollectionsForProfile(userId),
    getProfile(userId),
    getFollowingIds(userId),
  ]);
  if (reviewsResult.error) throw reviewsResult.error;
  if (locationResult.error) throw locationResult.error;
  if (goalsResult.error) throw goalsResult.error;

  const reviews: BadgeReview[] = (reviewsResult.data as unknown as BadgeReviewRow[]).flatMap((row) =>
    row.place
      ? [
          {
            createdAt: row.created_at,
            cityId: row.place.city_id,
            country: row.place.city?.country ?? '',
            placeType: row.place.place_type,
            latitude: row.place.latitude,
            textLength: row.body?.length ?? 0,
            photoCount: row.media.length,
            likeCount: row.like_count ?? 0,
          },
        ]
      : [],
  );

  const currentYear = new Date().getFullYear();
  const goal = (goalsResult.data as GoalRow[]).find((row) => row.year === currentYear);
  const travelGoalProgress = goal ? progressForGoal(goal, reviews) / goal.target : null;

  return {
    reviews,
    homeCityId: locationResult.data?.home_city_id ?? null,
    travelGoalProgress,
    ownCollectionCount: collections.length,
    hasProfilePhoto: !!profile?.profilePicture,
    hasBio: !!profile?.bio,
    followingCount: followingIds.length,
  };
}

function progressForGoal(goal: GoalRow, reviews: BadgeReview[]): number {
  const reviewsThisYear = reviews.filter((review) => review.createdAt.startsWith(String(goal.year)));
  if (goal.metric === 'places') return reviewsThisYear.length;
  if (goal.metric === 'countries') return new Set(reviewsThisYear.map((review) => review.country)).size;
  return new Set(reviewsThisYear.map((review) => review.cityId)).size;
}

// How many reviews share a place type, counting with categoryFor's bucket
// for Food Crawl, or the exact place_type slug for the Taste badges.
function countByPlaceType(reviews: BadgeReview[], placeType: string): number {
  return reviews.filter((review) => review.placeType === placeType).length;
}

// Every calendar week (Mon-Sun, UTC) that has at least one review, as the
// Monday date string ("2026-11-16") it falls in -- for streaks.
function reviewWeeks(reviews: BadgeReview[]): Set<string> {
  const weeks = new Set<string>();
  for (const review of reviews) {
    const date = new Date(review.createdAt);
    const monday = new Date(date);
    const day = date.getUTCDay(); // 0 (Sun) - 6 (Sat)
    monday.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
    weeks.add(monday.toISOString().slice(0, 10));
  }
  return weeks;
}

function reviewMonths(reviews: BadgeReview[]): Set<string> {
  return new Set(reviews.map((review) => review.createdAt.slice(0, 7))); // "2026-11"
}

function longestConsecutiveRun(keys: Set<string>, stepDays: number): number {
  const sorted = [...keys].map((key) => new Date(`${key}T00:00:00Z`).getTime()).sort((a, b) => a - b);
  let best = sorted.length > 0 ? 1 : 0;
  let current = best;
  const stepMs = stepDays * 24 * 60 * 60 * 1000;
  for (let i = 1; i < sorted.length; i++) {
    current = sorted[i] - sorted[i - 1] <= stepMs + 24 * 60 * 60 * 1000 ? current + 1 : 1;
    best = Math.max(best, current);
  }
  return best;
}

// 0 = Dec/Jan/Feb (Winter) ... 3 = Sep/Oct/Nov (Fall), grouped by calendar
// year so Four Seasons means one single year, not any 12-month span.
function seasonsByYear(reviews: BadgeReview[]): Map<number, Set<number>> {
  const byYear = new Map<number, Set<number>>();
  for (const review of reviews) {
    const date = new Date(review.createdAt);
    const year = date.getUTCFullYear();
    const season = Math.floor(((date.getUTCMonth() + 1) % 12) / 3); // Dec(11)->0, Mar-May->1, ...
    if (!byYear.has(year)) byYear.set(year, new Set());
    byYear.get(year)!.add(season);
  }
  return byYear;
}

function hasTwoCountriesWithin24h(reviews: BadgeReview[]): boolean {
  const sorted = [...reviews].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const gap = new Date(sorted[j].createdAt).getTime() - new Date(sorted[i].createdAt).getTime();
      if (gap > dayMs) break;
      if (sorted[j].country && sorted[i].country && sorted[j].country !== sorted[i].country) return true;
    }
  }
  return false;
}

function hasThreeFoodSpotsInOneDay(reviews: BadgeReview[]): boolean {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    if (categoryFor(review.placeType) !== 'Food') continue;
    const day = review.createdAt.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= 3);
}

// Badge rules live in code, not the database.
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Starter -- these sit alongside the Profile Checklist (ProfileChecklist),
  // not instead of it. The checklist stays up as the reminder of what's left;
  // these are the "nice to have" moment for each step, and Cleared for
  // Takeoff is finishing the whole thing (profile-checklist.tsx's 4 steps).
  {
    id: 'passport_photo',
    name: 'Passport Photo',
    icon: '🪪',
    description: 'Add a profile photo',
    category: 'starter',
    secret: false,
    levelReached: (ctx) => (ctx.hasProfilePhoto ? 1 : 0),
  },
  {
    id: 'first_stamp',
    name: 'First Stamp',
    icon: '🎫',
    description: 'Make your first post',
    category: 'starter',
    secret: false,
    levelReached: (ctx) => (ctx.reviews.length > 0 ? 1 : 0),
  },
  {
    id: 'travel_buddies',
    name: 'Travel Buddies',
    icon: '🧑‍🤝‍🧑',
    description: 'Follow 3 people',
    category: 'starter',
    secret: false,
    levelReached: (ctx) => (ctx.followingCount >= 3 ? 1 : 0),
  },
  {
    id: 'cleared_for_takeoff',
    name: 'Cleared for Takeoff',
    icon: '✈️',
    description: 'Finish setting up your profile',
    category: 'starter',
    secret: false,
    levelReached: (ctx) =>
      ctx.hasProfilePhoto && ctx.hasBio && ctx.reviews.length > 0 && ctx.followingCount >= 3 ? 1 : 0,
  },

  // Explorer
  {
    id: 'stamp_collector',
    name: 'Stamp Collector',
    icon: '🛂',
    description: 'Post from countries',
    category: 'explorer',
    secret: false,
    levels: [3, 5, 10, 25],
    levelReached: (ctx) => {
      const count = new Set(ctx.reviews.map((review) => review.country)).size;
      return [3, 5, 10, 25].filter((threshold) => count >= threshold).length;
    },
  },
  {
    id: 'city_hopper',
    name: 'City Hopper',
    icon: '🏙️',
    description: 'Post from cities',
    category: 'explorer',
    secret: false,
    levels: [5, 15, 30],
    levelReached: (ctx) => {
      const count = new Set(ctx.reviews.map((review) => review.cityId)).size;
      return [5, 15, 30].filter((threshold) => count >= threshold).length;
    },
  },
  {
    id: 'local_legend',
    name: 'Local Legend',
    icon: '📍',
    description: 'Review places in your home city',
    category: 'explorer',
    secret: false,
    levels: [10, 25],
    levelReached: (ctx) => {
      if (!ctx.homeCityId) return 0;
      const count = ctx.reviews.filter((review) => review.cityId === ctx.homeCityId).length;
      return [10, 25].filter((threshold) => count >= threshold).length;
    },
  },
  {
    id: 'both_sides',
    name: 'Both Sides of the World',
    icon: '🌐',
    description: "Post from the northern and southern hemisphere",
    category: 'explorer',
    secret: false,
    levelReached: (ctx) => {
      const hasNorth = ctx.reviews.some((review) => review.latitude != null && review.latitude >= 0);
      const hasSouth = ctx.reviews.some((review) => review.latitude != null && review.latitude < 0);
      return hasNorth && hasSouth ? 1 : 0;
    },
  },

  // Taste
  {
    id: 'bean_counter',
    name: 'Bean Counter',
    icon: '☕',
    description: 'Review 10 cafés',
    category: 'taste',
    secret: false,
    levelReached: (ctx) => (countByPlaceType(ctx.reviews, 'cafe') >= 10 ? 1 : 0),
  },
  {
    id: 'full_course',
    name: 'Full Course',
    icon: '🍝',
    description: 'Review 10 restaurants',
    category: 'taste',
    secret: false,
    levelReached: (ctx) => (countByPlaceType(ctx.reviews, 'restaurant') >= 10 ? 1 : 0),
  },
  {
    id: 'thrill_seeker',
    name: 'Thrill Seeker',
    icon: '🥾',
    description: 'Review 5 excursions',
    category: 'taste',
    secret: false,
    levelReached: (ctx) => (countByPlaceType(ctx.reviews, 'excursion') >= 5 ? 1 : 0),
  },
  {
    id: 'garden_variety',
    name: 'Garden Variety',
    icon: '🌿',
    description: 'Review 5 gardens',
    category: 'taste',
    secret: false,
    levelReached: (ctx) => (countByPlaceType(ctx.reviews, 'garden') >= 5 ? 1 : 0),
  },
  {
    id: 'game_on',
    name: 'Game On',
    icon: '🎽',
    description: 'Review 5 sport spots',
    category: 'taste',
    secret: false,
    levelReached: (ctx) => (countByPlaceType(ctx.reviews, 'sport') >= 5 ? 1 : 0),
  },
  {
    id: 'museum_mode',
    name: 'Museum Mode',
    icon: '🏛️',
    description: 'Review 5 museums',
    category: 'taste',
    secret: false,
    levelReached: (ctx) => (countByPlaceType(ctx.reviews, 'museum') >= 5 ? 1 : 0),
  },
  {
    id: 'well_rounded',
    name: 'Well Rounded',
    icon: '🎯',
    description: 'Post in 5 different kinds of places',
    category: 'taste',
    secret: false,
    levelReached: (ctx) => (new Set(ctx.reviews.map((review) => review.placeType)).size >= 5 ? 1 : 0),
  },

  // Reviewer
  {
    id: 'wordsmith',
    name: 'Wordsmith',
    icon: '✍️',
    description: 'Write 10 reviews with 100+ characters',
    category: 'reviewer',
    secret: false,
    levelReached: (ctx) => (ctx.reviews.filter((review) => review.textLength >= 100).length >= 10 ? 1 : 0),
  },
  {
    id: 'shutterbug',
    name: 'Shutterbug',
    icon: '📸',
    description: 'Post 25 photos',
    category: 'reviewer',
    secret: false,
    levelReached: (ctx) =>
      ctx.reviews.reduce((sum, review) => sum + review.photoCount, 0) >= 25 ? 1 : 0,
  },
  {
    id: 'crowd_favorite',
    name: 'Crowd Favorite',
    icon: '❤️',
    description: 'Get 50 likes total',
    category: 'reviewer',
    secret: false,
    levelReached: (ctx) => (ctx.reviews.reduce((sum, review) => sum + review.likeCount, 0) >= 50 ? 1 : 0),
  },

  // Secret
  {
    id: 'night_owl',
    name: 'Night Owl',
    icon: '🦉',
    description: 'Post between midnight and 4am',
    category: 'secret',
    secret: true,
    levelReached: (ctx) =>
      ctx.reviews.some((review) => new Date(review.createdAt).getHours() < 4) ? 1 : 0,
  },
  {
    id: 'jet_lag',
    name: 'Jet Lag',
    icon: '🧳',
    description: 'Post from 2 countries within 24 hours',
    category: 'secret',
    secret: true,
    levelReached: (ctx) => (hasTwoCountriesWithin24h(ctx.reviews) ? 1 : 0),
  },
  {
    id: 'food_crawl',
    name: 'Food Crawl',
    icon: '🍽️',
    description: '3 food spots in one day',
    category: 'secret',
    secret: true,
    levelReached: (ctx) => (hasThreeFoodSpotsInOneDay(ctx.reviews) ? 1 : 0),
  },

  // Streak
  {
    id: 'on_a_roll',
    name: 'On a Roll',
    icon: '🔥',
    description: 'Post 4 weeks in a row',
    category: 'streak',
    secret: false,
    levelReached: (ctx) => (longestConsecutiveRun(reviewWeeks(ctx.reviews), 7) >= 4 ? 1 : 0),
  },
  {
    id: 'regular',
    name: 'Regular',
    icon: '📅',
    description: 'Post every month for 6 months',
    category: 'streak',
    secret: false,
    levelReached: (ctx) => (longestConsecutiveRun(reviewMonths(ctx.reviews), 31) >= 6 ? 1 : 0),
  },
  {
    id: 'four_seasons',
    name: 'Four Seasons',
    icon: '🍂',
    description: 'Post in all 4 seasons of one year',
    category: 'streak',
    secret: false,
    levelReached: (ctx) => ([...seasonsByYear(ctx.reviews).values()].some((seasons) => seasons.size >= 4) ? 1 : 0),
  },
  {
    id: 'goal_getter',
    name: 'Goal Getter',
    icon: '🏆',
    description: "Hit this year's travel goal",
    category: 'streak',
    secret: false,
    levels: [1, 2],
    levelReached: (ctx) => {
      if (ctx.travelGoalProgress == null) return 0;
      return [1, 2].filter((threshold) => ctx.travelGoalProgress! >= threshold).length;
    },
  },

  // Collection
  {
    id: 'curator',
    name: 'Curator',
    icon: '🗂️',
    description: 'Make 3 of your own collections',
    category: 'collection',
    secret: false,
    levelReached: (ctx) => (ctx.ownCollectionCount >= 3 ? 1 : 0),
  },
];

function toUserBadge(row: { user_id: string; badge_id: string; level: number; earned_at: string; seen_at: string | null; backfilled: boolean }): UserBadge {
  return {
    userId: row.user_id,
    badgeId: row.badge_id,
    level: row.level,
    earnedAt: row.earned_at,
    seenAt: row.seen_at,
    backfilled: row.backfilled,
  };
}

// Everyone's earned badges are visible (except to people they've blocked),
// same as reviews -- see the Badges tab on any profile.
export async function getBadgesForProfile(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase.from('user_badges').select('*').eq('user_id', userId);
  if (error) throw error;
  return data.map(toUserBadge);
}

// Every badge/level the signed-in user has reached.
export async function getUserBadges(): Promise<UserBadge[]> {
  return getBadgesForProfile(await currentUserId());
}

// Rows with seen_at still empty -- badges earned since the last time the
// pop-up ran. Oldest first, so they show in the order they were earned.
export async function getUnseenBadges(): Promise<UserBadge[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .is('seen_at', null)
    .order('earned_at');
  if (error) throw error;
  return data.map(toUserBadge);
}

export async function markBadgeSeen(badgeId: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from('user_badges')
    .update({ seen_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('badge_id', badgeId);
  if (error) throw error;
}

// Re-runs every rule and upserts anything newly earned or levelled up.
// Doesn't throw on failure to look anything up here -- a missed badge check
// shouldn't ever fail the post/follow/save it's riding along with.
export async function checkBadges(): Promise<void> {
  const userId = await currentUserId();
  try {
    const [context, existing] = await Promise.all([getBadgeContext(userId), getUserBadges()]);
    const existingByBadge = new Map(existing.map((row) => [row.badgeId, row]));

    const updates = BADGE_DEFINITIONS.flatMap((badge) => {
      const level = badge.levelReached(context);
      if (level <= 0) return [];
      const current = existingByBadge.get(badge.id);
      if (current && current.level >= level) return [];
      return [{ user_id: userId, badge_id: badge.id, level, seen_at: null }];
    });

    if (updates.length === 0) return;
    const { error } = await supabase.from('user_badges').upsert(updates, { onConflict: 'user_id,badge_id' });
    if (error) throw error;
  } catch (error) {
    console.error('checkBadges failed', error);
  }
}
