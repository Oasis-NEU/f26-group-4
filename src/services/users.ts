import { mockRequest } from './mock-backend';

import type { Profile } from '@/types/profile';

// Mock users for the Profile page. Each has their own home country, interests,
// and friends so switching users in the demo visibly changes the app.
// Later each function's body becomes a Supabase query; screens don't have to change.

export const mockUsers: Profile[] = [
  {
    id: 'u1',
    name: 'Folake',
    username: 'folake',
    profilePicture: 'https://i.pravatar.cc/200?img=47',
    bio: 'Chasing good coffee and better views.',
    homeCountry: 'US',
    currentCountry: 'FR',
    interests: ['hiking', 'photography'],
    friendIds: ['u2'],
    postIds: [],
  },
  {
    id: 'u2',
    name: 'Kenji',
    username: 'kenji_travels',
    profilePicture: 'https://i.pravatar.cc/200?img=12',
    homeCountry: 'JP',
    currentCountry: 'IT',
    interests: ['food', 'photography'],
    friendIds: ['u1'],
    postIds: [],
  },
  {
    id: 'u3',
    name: 'Amara',
    username: 'amara',
    profilePicture: 'https://i.pravatar.cc/200?img=32',
    bio: 'New here!',
    homeCountry: 'NG',
    currentCountry: 'FR',
    interests: ['museums', 'hiking'],
    friendIds: [],
    postIds: [],
  },
];

// One profile by its id, or null if there isn't one
export async function getProfile(id: string): Promise<Profile | null> {
  return mockRequest(mockUsers.find((user) => user.id === id) ?? null);
}

// People the user could add as friends: everyone except themselves and people
// they're already friends with. Ones with shared interests or the same
// current country come first.
export async function getSuggestedFriends(userId: string): Promise<Profile[]> {
  const me = mockUsers.find((user) => user.id === userId);
  if (!me) return mockRequest([]);

  const score = (other: Profile) =>
    other.interests.filter((i) => me.interests.includes(i)).length +
    (other.currentCountry === me.currentCountry ? 1 : 0);

  const suggestions = mockUsers
    .filter((user) => user.id !== userId && !me.friendIds.includes(user.id))
    .sort((a, b) => score(b) - score(a));

  return mockRequest(suggestions);
}

// Saves changes to a profile and returns the updated profile,
// or null if the user doesn't exist.
export async function updateProfile(
  id: string,
  changes: Partial<Omit<Profile, 'id'>>,
): Promise<Profile | null> {
  const index = mockUsers.findIndex((user) => user.id === id);
  if (index === -1) return mockRequest(null);
  mockUsers[index] = { ...mockUsers[index], ...changes };
  return mockRequest(mockUsers[index]);
}