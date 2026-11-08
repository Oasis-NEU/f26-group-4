// Interests people can pick for their profile: a starter list, plus anything
// users add themselves, from Supabase. The starter list lives in the people
// migration; how many people picked each one is counted by the database.

import { currentUserId, supabase } from '@/lib/supabase';

import { getReviewsByAuthor } from './reviews';

import type { Interest } from '@/types/interest';

const INTEREST_SELECT = 'id, name, slug, created_by, is_starter, user_count';

type InterestRow = {
  id: string;
  name: string;
  slug: string;
  created_by: string | null;
  is_starter: boolean;
  user_count: number | null;
};

function toInterest(row: InterestRow): Interest {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdBy: row.created_by ?? undefined,
    isStarter: row.is_starter,
    userCount: row.user_count ?? 0,
  };
}

// Maps the kind of place someone reviewed to an interest that might be
// relevant, for the Interests panel's "From your posts" suggestions.
const INTEREST_SLUGS_BY_PLACE_TYPE: Record<string, string[]> = {
  cafe: ['coffee'],
  restaurant: ['food'],
  excursion: ['hiking', 'adventure'],
  garden: ['nature'],
  museum: ['museums'],
  landmark: ['history'],
};

// Resolves a profile's interestIds back to full Interest records, e.g. for
// displaying their names as chips, in the same order. Unknown ids are skipped.
export async function getInterestsByIds(ids: string[]): Promise<Interest[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('interests').select(INTEREST_SELECT).in('id', ids);
  if (error) throw error;
  const byId = new Map((data as InterestRow[]).map((row) => [row.id, toInterest(row)]));
  return ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
}

// Interests eligible to show in "Popular on the app": the starter list, plus
// ones at least 5 people picked, most picked first.
export async function getPopularInterests(limit = 10): Promise<Interest[]> {
  const { data, error } = await supabase.rpc('popular_interests', { max_results: limit }).select(INTEREST_SELECT);
  if (error) throw error;
  return (data as unknown as InterestRow[]).map(toInterest);
}

// Interests whose name matches the search text, regardless of popularity --
// used by the "Find or add an interest" box, including a user's own new ones.
export async function searchInterests(query: string): Promise<Interest[]> {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
  const { data, error } = await supabase
    .from('interests')
    .select(INTEREST_SELECT)
    .ilike('name', pattern)
    .order('name')
    .limit(20);
  if (error) throw error;
  return (data as InterestRow[]).map(toInterest);
}

// Interests suggested from the place types in the signed-in user's own
// reviews, e.g. reviewing cafes suggests "Coffee".
export async function suggestInterestsFromPosts(): Promise<Interest[]> {
  const reviews = await getReviewsByAuthor(await currentUserId());

  const slugs = new Set<string>();
  for (const review of reviews) {
    for (const slug of INTEREST_SLUGS_BY_PLACE_TYPE[review.placeType] ?? []) {
      slugs.add(slug);
    }
  }
  if (slugs.size === 0) return [];

  const { data, error } = await supabase.from('interests').select(INTEREST_SELECT).in('slug', [...slugs]);
  if (error) throw error;
  return (data as InterestRow[]).map(toInterest);
}

// Adds a user-made interest, or returns the existing one if the slug already
// matches something (catches "Street Food" vs. "street food", etc).
export async function addInterest(name: string): Promise<Interest> {
  const { data, error } = await supabase
    .rpc('add_interest', { interest_name: name })
    .select(INTEREST_SELECT)
    .single();
  if (error) throw error;
  return toInterest(data as unknown as InterestRow);
}
