// Interests people can pick for their profile: a starter list, plus anything
// users add themselves. Fake data for now, same idea as users.ts: when
// Supabase is set up, only this file changes.

import { mockRequest } from './mock-backend';
import { getReviewsByAuthor } from './reviews';

import type { Interest, Tag, TagKind } from '@/types/interest';

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

function starter(name: string, userCount: number, kind: TagKind = 'interest'): Interest {
  const slug = slugify(name);
  return { id: `${kind}_${slug}`, name, slug, kind, isStarter: true, userCount };
}

// A STARTER LIST, NOT THE WHOLE LIST. Anyone can add a tag that isn't here --
// see addTag() at the bottom -- and it then shows up for everyone else. These
// are only what a brand new app starts with so the pickers aren't empty.
//
// userCount values are just for demo sorting in "Popular on the app".
const mockInterests: Interest[] = [
  // --- 'interest': a profile's interests AND a place's "best suited for" ---
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
  // These came from the `suitedFor` values already on the mock places. They're
  // in the same list because "best suited for" and interests are the same tags.
  starter('Solo', 310),
  starter('Couples', 290),
  starter('Groups', 180),
  starter('Family', 240),
  starter('Skiers', 95),
  starter('Remote work', 130),
  starter('Budget', 160),
  starter('Luxury', 140),
  starter('Accessible', 60),
  starter('Dog friendly', 85),

  // --- 'place-type': what the place IS ---
  starter('Cafe', 540, 'place-type'),
  starter('Restaurant', 820, 'place-type'),
  starter('Bar', 470, 'place-type'),
  starter('Hotel', 390, 'place-type'),
  starter('Museum', 350, 'place-type'),
  starter('Gallery', 170, 'place-type'),
  starter('Park', 330, 'place-type'),
  starter('Garden', 150, 'place-type'),
  starter('Beach', 400, 'place-type'),
  starter('Hike', 420, 'place-type'),
  starter('Viewpoint', 260, 'place-type'),
  starter('Excursion', 230, 'place-type'),
  starter('Landmark', 300, 'place-type'),
  starter('Market', 280, 'place-type'),
  starter('Shop', 190, 'place-type'),
  starter('Ski run', 90, 'place-type'),
  starter('Spa', 110, 'place-type'),
  starter('Campsite', 100, 'place-type'),
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
  const eligible = mockInterests.filter(
    (interest) =>
      interest.kind === 'interest' && (interest.isStarter || interest.userCount >= POPULAR_THRESHOLD),
  );
  const sorted = [...eligible].sort((a, b) => b.userCount - a.userCount);
  return mockRequest(sorted.slice(0, limit));
}

// Interests whose name matches the search text, regardless of popularity --
// used by the "Find or add an interest" box, including a user's own new ones.
export async function searchInterests(query: string): Promise<Interest[]> {
  const q = query.trim().toLowerCase();
  if (!q) return mockRequest([]);
  const matches = mockInterests.filter(
    (interest) => interest.kind === 'interest' && interest.name.toLowerCase().includes(q),
  );
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

  const suggestions = mockInterests.filter(
    (interest) => interest.kind === 'interest' && suggestedSlugs.has(interest.slug),
  );
  return mockRequest(suggestions);
}

// Adds a user-made interest, or returns the existing one if the slug already
// matches something (catches "Street Food" vs. "street food", etc).
export async function addInterest(name: string, userId: string): Promise<Interest> {
  return addTag('interest', name, userId);
}

// ---------------------------------------------------------------------------
// Tags in general
// ---------------------------------------------------------------------------
//
// The functions above are the Profile page's view of this list: they only ever
// look at kind 'interest'. The ones below work on either kind, so the Upload
// page can offer place types and the New collection screen can offer both.
//
// The important bit is that NONE of these lists are fixed. Every picker in the
// app searches this one growing list, and anything someone types that isn't in
// it yet gets added by addTag().

// Tags of one kind whose name matches the search text. An empty search gives
// back the popular ones, so the picker has something to show before you type.
export async function searchTags(kind: TagKind, query: string): Promise<Tag[]> {
  const text = query.trim().toLowerCase();
  const ofThisKind = mockInterests.filter((tag) => tag.kind === kind);

  if (text === '') {
    const sorted = [...ofThisKind].sort((a, b) => b.userCount - a.userCount);
    return mockRequest(sorted);
  }

  // Tags that START with what was typed come first: typing "ca" should offer
  // "Cafe" before "Vatican City"-style matches further down the word.
  const startsWith: Tag[] = [];
  const contains: Tag[] = [];

  for (const tag of ofThisKind) {
    const name = tag.name.toLowerCase();

    if (name.startsWith(text)) {
      startsWith.push(tag);
    } else if (name.includes(text)) {
      contains.push(tag);
    }
  }

  return mockRequest([...startsWith, ...contains]);
}

// Adds a tag someone typed, or gives back the one that's already there if the
// slug matches (so "Street Food", "street food" and "Street food" stay one tag).
export async function addTag(kind: TagKind, name: string, userId: string): Promise<Tag> {
  const slug = slugify(name);
  const existing = mockInterests.find((tag) => tag.kind === kind && tag.slug === slug);

  if (existing) {
    return mockRequest(existing);
  }

  const created: Tag = {
    id: `${kind}_${slug}`,
    name: name.trim(),
    slug,
    kind,
    createdBy: userId,
    isStarter: false,
    userCount: 1, // the person who made it counts as the first use
  };

  mockInterests.push(created);
  return mockRequest(created);
}
