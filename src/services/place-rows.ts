// Shared by every service that returns places or reviews (places.ts,
// collections.ts, cities.ts, reviews.ts): what to ask Supabase for, and how a
// database row becomes the app's Place and Review types. Rows are snake_case;
// the app's types are camelCase (docs/data-layer.md, 2c).
import { getMediaUrl } from './media';

import type { Media } from '@/types/media';
import type { Place } from '@/types/place';
import type { Review } from '@/types/review';

// A review with its author's username, its like count and its photos.
// Reviews reach profiles two ways (the author, and the people who liked it
// through review_likes), so the author's link is named.
export const REVIEW_SELECT =
  'id, author_id, rating, body, suited_for, created_at, like_count, author:profiles!reviews_author_id_fkey(username), photos:review_media(path, caption, position)';

// A place with its calculated ratings, its city, and its reviews.
// average_rating and friends_rating are worked out by the database when asked for.
export const PLACE_SELECT = `id, name, place_type, suited_for, address, latitude, longitude, website, cover_path, description, ai_summary, is_verified, created_at, average_rating, friends_rating, city:cities(name, country), reviews(${REVIEW_SELECT})`;

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReviewRow = {
  id: string;
  author_id: string;
  rating: number;
  body: string | null;
  suited_for: string[];
  created_at: string;
  like_count: number | null;
  author: { username: string } | null;
  photos: { path: string; caption: string | null; position: number }[];
};

export type PlaceRow = {
  id: string;
  name: string;
  place_type: string;
  suited_for: string[];
  address: string;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  cover_path: string | null;
  description: string | null;
  ai_summary: string | null;
  is_verified: boolean;
  created_at: string;
  average_rating: number | null;
  friends_rating: number | null;
  city: { name: string; country: string } | null;
  reviews: ReviewRow[];
};

// The place a review belongs to, as much as toReview needs of it.
type ReviewPlace = Pick<PlaceRow, 'id' | 'place_type' | 'address' | 'website' | 'city'>;

// Whether the signed-in user saved a place or liked a review isn't part of
// these: it's its own query (useIsSaved, useIsLiked), so the same place data
// works for everyone (docs/data-layer.md, rule 6).

export function toReview(row: ReviewRow, place: ReviewPlace): Review {
  return {
    id: row.id,
    profileName: row.author?.username ?? 'someone',
    placeID: place.id,
    rating: Math.min(5, Math.max(1, row.rating)) as Review['rating'],
    placeType: place.place_type,
    reviewText: row.body ?? undefined,
    isVerified: false, // reviews have no "verified" yet (docs/backend-plan.md)
    suitedFor: row.suited_for,
    address: place.address,
    city: place.city?.name ?? '',
    country: place.city?.country ?? '',
    website: place.website ?? undefined,
    media: [...row.photos]
      .sort((a, b) => a.position - b.position)
      .map((photo): Media => ({ type: 'photo', url: getMediaUrl(photo.path) ?? '', caption: photo.caption ?? undefined })),
    authorId: row.author_id,
    createdAt: row.created_at.slice(0, 10),
    likeCount: row.like_count ?? 0,
  };
}

// Opens the phone's maps at the place: its coordinates if it has them,
// otherwise its address.
function directionsFor(row: PlaceRow): string {
  const query =
    row.latitude !== null && row.longitude !== null
      ? `${row.latitude},${row.longitude}`
      : [row.address, row.city?.name, row.city?.country].filter(Boolean).join(', ');
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

export function toPlace(row: PlaceRow): Place {
  // Oldest first, as the mock data had them: the Feed card shows the last one as the newest.
  const reviews = [...(row.reviews ?? [])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((review) => toReview(review, row));
  // Every photo from its reviews, newest review first.
  const media = [...reviews]
    .reverse()
    .flatMap((review) => review.media)
    .filter((item) => item.url);

  return {
    id: row.id,
    name: row.name,
    averageRating: row.average_rating ?? 0,
    friendsRating: row.friends_rating ?? undefined,
    isVerified: row.is_verified,
    suitedFor: row.suited_for,
    placeType: row.place_type,
    address: row.address,
    city: row.city?.name ?? '',
    country: row.city?.country ?? '',
    website: row.website ?? undefined,
    directions: directionsFor(row),
    coverImage: getMediaUrl(row.cover_path) ?? media[0]?.url ?? '',
    media,
    description: row.description ?? undefined,
    aiSummary: row.ai_summary ?? undefined,
    reviews,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}
