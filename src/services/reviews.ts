// Reviews-by-author, for the Profile page ("Places I've been" + badges/goals).
//
// There's no standalone review list yet -- reviews live nested under each
// place in src/services/places.ts (Ruby/Henry/Jess's file). This flattens
// them instead of duplicating the data.
//
// NOTE: none of the current mock reviews have `authorId` set, so this returns
// [] for every user until a few get tagged with one. That's a change to
// places.ts, done later alongside the rest of the teammate-owned-file work.

import { mockRequest } from './mock-backend';
import { mockPlaces } from './places';

import type { Review } from '@/types/review';

export type AuthoredReview = Review & { placeName: string };

// Every review this user wrote, newest first (reviews without a createdAt sort last).
export async function getReviewsByAuthor(authorId: string): Promise<AuthoredReview[]> {
  const reviews: AuthoredReview[] = [];

  for (const place of mockPlaces) {
    for (const review of place.reviews ?? []) {
      if (review.authorId === authorId) {
        reviews.push({ ...review, placeName: place.name });
      }
    }
  }

  reviews.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  return mockRequest(reviews);
}
