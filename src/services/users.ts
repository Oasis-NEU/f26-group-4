import { getFollowerIds, getFollowingIds } from './follows';
import { mockRequest } from './mock-backend';

import type { Profile, VisibleTravelStatus } from '@/types/profile';

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
    homeCity: 'Boston',
    status: { kind: 'traveling', city: 'Paris', country: 'FR', until: '2026-11-20' },
    statusSharing: { closeFriends: 'full', everyone: 'country' },
    closeFriendIds: ['u2'],
    interests: ['hiking', 'photography'],
  },
  {
    id: 'u2',
    name: 'Kenji',
    username: 'kenji_travels',
    profilePicture: 'https://i.pravatar.cc/200?img=12',
    homeCountry: 'JP',
    homeCity: 'Tokyo',
    status: { kind: 'planning', city: 'Rome', country: 'IT', month: '2026-12' },
    statusSharing: { closeFriends: 'full', everyone: 'country' },
    closeFriendIds: [],
    interests: ['food', 'photography'],
  },
  {
    id: 'u3',
    name: 'Amara',
    username: 'amara',
    profilePicture: 'https://i.pravatar.cc/200?img=32',
    bio: 'New here!',
    homeCountry: 'NG',
    homeCity: 'Lagos',
    status: { kind: 'home' },
    statusSharing: { closeFriends: 'full', everyone: 'country' },
    closeFriendIds: [],
    interests: ['museums', 'hiking'],
  },
];

// One profile by its id, or null if there isn't one
export async function getProfile(id: string): Promise<Profile | null> {
  return mockRequest(mockUsers.find((user) => user.id === id) ?? null);
}

// Trims a profile's status down to what a given viewer is allowed to see.
// The viewer sees their own status in full; everyone else gets the detail
// level the profile owner picked for close friends vs. everyone else.
// Anything that displays a status (cover photo, suggested-friends scoring,
// later trip-overlap) must read the status through this, never the raw field.
export function getVisibleStatus(profile: Profile, viewerId: string): VisibleTravelStatus | null {
  if (viewerId === profile.id) return profile.status;

  const level = profile.closeFriendIds.includes(viewerId)
    ? profile.statusSharing.closeFriends
    : profile.statusSharing.everyone;

  if (level === 'hidden') return null;

  const status = profile.status;
  if (status.kind === 'home') return status;

  const city = level === 'country' ? undefined : status.city;

  if (status.kind === 'traveling') {
    return { kind: 'traveling', country: status.country, city, until: level === 'full' ? status.until : undefined };
  }

  return { kind: 'planning', country: status.country, city, month: level === 'full' ? status.month : undefined };
}

// People the user could follow: everyone except themselves and people they
// already follow. Ones with shared interests or who are traveling in the
// same country (as far as the viewer can see) come first.
export async function getSuggestedFriends(userId: string): Promise<Profile[]> {
  const me = mockUsers.find((user) => user.id === userId);
  if (!me) return mockRequest([]);

  const myStatus = getVisibleStatus(me, userId); // viewing yourself always returns the full status
  const alreadyFollowing = await getFollowingIds(userId);

  const sameTravelCountry = (other: Profile) => {
    const otherStatus = getVisibleStatus(other, userId);
    return myStatus?.kind === 'traveling' && otherStatus?.kind === 'traveling' && otherStatus.country === myStatus.country;
  };

  const score = (other: Profile) =>
    other.interests.filter((i) => me.interests.includes(i)).length + (sameTravelCountry(other) ? 1 : 0);

  const suggestions = mockUsers
    .filter((user) => user.id !== userId && !alreadyFollowing.includes(user.id))
    .sort((a, b) => score(b) - score(a));

  return mockRequest(suggestions);
}

// The reason line shown under a suggested friend's name, e.g. "Also in Lisbon"
// or "4 mutuals". Undefined when there's nothing noteworthy to say.
export async function getSuggestionReason(myId: string, other: Profile): Promise<string | undefined> {
  const me = mockUsers.find((user) => user.id === myId);
  if (!me) return undefined;

  const myStatus = getVisibleStatus(me, myId);
  const otherStatus = getVisibleStatus(other, myId);

  if (
    myStatus &&
    myStatus.kind !== 'home' &&
    otherStatus &&
    otherStatus.kind !== 'home' &&
    otherStatus.country === myStatus.country
  ) {
    return otherStatus.city ? `Also in ${otherStatus.city}` : `Also in ${otherStatus.country}`;
  }

  const [myFollowers, otherFollowers] = await Promise.all([getFollowerIds(myId), getFollowerIds(other.id)]);
  const mutualCount = myFollowers.filter((id) => otherFollowers.includes(id)).length;
  if (mutualCount > 0) return `${mutualCount} mutual${mutualCount === 1 ? '' : 's'}`;

  return undefined;
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