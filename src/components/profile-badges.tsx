import { StyleSheet, Text, View } from 'react-native';

import type { AuthoredReview } from '@/services/reviews';
import type { TravelGoal } from '@/types/profile';

// The Badges tab: yearly travel goal progress, earned badges, and a "traveler
// type" split (e.g. Food 55% / Outdoors 25% / Culture 20%). Everything here is
// calculated from the user's reviews each time -- nothing is stored.

const CATEGORY_BY_PLACE_TYPE: Record<string, string> = {
  cafe: 'Food',
  restaurant: 'Food',
  excursion: 'Outdoors',
  garden: 'Outdoors',
  sport: 'Outdoors',
  museum: 'Culture',
  landmark: 'Culture',
};

function categoryFor(placeType: string): string {
  return CATEGORY_BY_PLACE_TYPE[placeType] ?? 'Other';
}

function uniqueCountries(reviews: AuthoredReview[]): number {
  return new Set(reviews.map((review) => review.country)).size;
}

function uniqueCities(reviews: AuthoredReview[]): number {
  return new Set(reviews.map((review) => review.city)).size;
}

export type Badge = {
  id: string;
  label: string;
  earned: (reviews: AuthoredReview[]) => boolean;
};

// Badge rules live in code, not the database.
export const BADGES: Badge[] = [
  { id: 'countries_3', label: '3 countries', earned: (reviews) => uniqueCountries(reviews) >= 3 },
  { id: 'countries_10', label: '10 countries', earned: (reviews) => uniqueCountries(reviews) >= 10 },
  { id: 'cities_5', label: '5 cities', earned: (reviews) => uniqueCities(reviews) >= 5 },
  { id: 'places_10', label: '10 places', earned: (reviews) => reviews.length >= 10 },
];

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

type ProfileBadgesProps = {
  reviews: AuthoredReview[];
  goals?: TravelGoal[];
};

export function ProfileBadges({ reviews, goals }: ProfileBadgesProps) {
  if (reviews.length === 0) {
    return <Text style={styles.empty}>Post a review to start earning badges.</Text>;
  }

  const earnedBadges = BADGES.filter((badge) => badge.earned(reviews));
  const travelerType = getTravelerType(reviews);

  return (
    <View style={styles.container}>
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

      {earnedBadges.length > 0 && (
        <View style={styles.badgeRow}>
          {earnedBadges.map((badge) => (
            <View key={badge.id} style={styles.badgePill}>
              <Text style={styles.badgePillText}>{badge.label}</Text>
            </View>
          ))}
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  empty: {
    color: 'gray',
    textAlign: 'center',
    padding: 24,
  },
  goal: {
    gap: 4,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2A9D8F',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  badgePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  travelerTypeRow: {
    fontSize: 14,
    color: '#444',
  },
});
