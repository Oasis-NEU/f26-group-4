// Reviews by one person (the Profile page's "Places I've been", badges and
// goals), and likes. A review is a post: it's what Upload creates (posts.ts).

import { currentUserId, supabase } from '@/lib/supabase';

import { REVIEW_SELECT, toReview, type ReviewRow } from './place-rows';

import type { Review } from '@/types/review';

export type AuthoredReview = Review & { placeName: string };

type AuthoredRow = ReviewRow & {
  place: {
    id: string;
    name: string;
    place_type: string;
    address: string;
    website: string | null;
    city: { name: string; country: string } | null;
  } | null;
};

// Every review this user wrote, newest first.
export async function getReviewsByAuthor(authorId: string): Promise<AuthoredReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`${REVIEW_SELECT}, place:places(id, name, place_type, address, website, city:cities(name, country))`)
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as AuthoredRow[]).flatMap((row) =>
    row.place ? [{ ...toReview(row, row.place), placeName: row.place.name }] : [],
  );
}

// Ids of every review the signed-in user liked. Shared by every heart, the way
// getSavedPlaceIds is shared by every bookmark.
export async function getLikedReviewIds(): Promise<string[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase.from('review_likes').select('review_id').eq('user_id', userId);
  if (error) throw error;
  return data.map((row) => row.review_id);
}

export async function likeReview(reviewId: string): Promise<void> {
  // user_id fills itself in from the session.
  const { error } = await supabase.from('review_likes').insert({ review_id: reviewId });
  if (error && error.code !== '23505') throw error; // 23505: already liked, which is fine
}

export async function unlikeReview(reviewId: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', userId);
  if (error) throw error;
}
