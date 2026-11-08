// Interests people can pick for their profile: a starter list, plus anything
// users add themselves. Fake data for now, same idea as users.ts: when
// Supabase is set up, only this file changes.

import { mockRequest } from './mock-backend';
import { getReviewsByAuthor } from './reviews';

import type { Interest } from '@/types/interest';

// A new interest only shows in "Popular" once this many people have picked it.
// Below that, it still shows on its creator's own profile, marked NEW.
const POPULAR_THRESHOLD = 5;

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function starter(name: string, userCount: number): Interest {
  const slug = slugify(name);
  return { id: `interest_${slug}`, name, slug, isStarter: true, userCount };
}

// userCount values are just for demo sorting in "Popular on the app".
const mockInterests: Interest[] = [
  starter('Hiking', 420),
  starter('Food', 980),
  starter('Photography', 610),
  starter('Museums', 350),
  starter('Street food', 275),
  starter('Coffee', 540),
  starter('Nature', 300),
  starter('Adventure', 260),
  starter('History', 190),
  starter('Nightlife', 230),
  starter('Art', 210),
  starter('Beaches', 400),
];

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
// displaying their names as chips. Unknown ids are skipped.
export async function getInterestsByIds(ids: string[]): Promise<Interest[]> {
  const found = ids
    .map((id) => mockInterests.find((interest) => interest.id === id))
    .filter((interest): interest is Interest => interest !== undefined);
  return mockRequest(found);
}

// Interests eligible to show in "Popular on the app", sorted by pick count.
export async function getPopularInterests(limit = 10): Promise<Interest[]> {
  const eligible = mockInterests.filter((interest) => interest.isStarter || interest.userCount >= POPULAR_THRESHOLD);
  const sorted = [...eligible].sort((a, b) => b.userCount - a.userCount);
  return mockRequest(sorted.slice(0, limit));
}

// Interests whose name matches the search text, regardless of popularity --
// used by the "Find or add an interest" box, including a user's own new ones.
export async function searchInterests(query: string): Promise<Interest[]> {
  const q = query.trim().toLowerCase();
  if (!q) return mockRequest([]);
  const matches = mockInterests.filter((interest) => interest.name.toLowerCase().includes(q));
  return mockRequest(matches);
}

// Interests suggested from the place types in this user's own reviews, e.g.
// reviewing cafes suggests "Coffee".
export async function suggestInterestsFromPosts(userId: string): Promise<Interest[]> {
  const reviews = await getReviewsByAuthor(userId);

  const suggestedSlugs = new Set<string>();
  for (const review of reviews) {
    for (const slug of INTEREST_SLUGS_BY_PLACE_TYPE[review.placeType] ?? []) {
      suggestedSlugs.add(slug);
    }
  }

  const suggestions = mockInterests.filter((interest) => suggestedSlugs.has(interest.slug));
  return mockRequest(suggestions);
}

// Adds a user-made interest, or returns the existing one if the slug already
// matches something (catches "Street Food" vs. "street food", etc).
export async function addInterest(name: string, userId: string): Promise<Interest> {
  const slug = slugify(name);
  const existing = mockInterests.find((interest) => interest.slug === slug);
  if (existing) return mockRequest(existing);

  const created: Interest = {
    id: `interest_${slug}`,
    name: name.trim(),
    slug,
    createdBy: userId,
    isStarter: false,
    userCount: 1, // the creator counts as the first pick
  };
  mockInterests.push(created);
  return mockRequest(created);
}
