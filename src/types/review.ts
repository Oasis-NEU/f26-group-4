import type { Media } from '../../types';

export type Review = {
  // Unique ID for this review.
  id: string;

  // Person who wrote the review.
  profileName: string;

  // Links the review to its place.
  placeID: string;

  rating: 1 | 2 | 3 | 4 | 5;
  placeType: string;
  reviewText?: string;
  isVerified: boolean;
  suitedFor?: string[];

  address: string;
  city: string;
  country: string;
  website?: string;

  // Existing field kept for compatibility.
  mediaType?: 'photo' | 'video';

  // Photos and videos attached to this review.
  // Uses your team's existing Media type.
  media?: Media[];
};