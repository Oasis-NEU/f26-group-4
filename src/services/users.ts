import { getFollowerIds, getFollowingIds } from './follows';
import { mockRequest } from './mock-backend';

import type { Profile, StatusDetail, TravelStatus, VisibleTravelStatus } from '@/types/profile';

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
    coverMode: 'auto',
    homeCityId: 'boston-us',
    dreamTripCityId: 'tokyo-jp',
    status: {
      kind: 'traveling',
      city: 'Paris',
      country: 'France',
      until: '2026-11-20',
      sharing: { closeFriends: 'full', everyone: 'country' },
    },
    closeFriendIds: ['u2'],
    interestIds: ['interest_hiking', 'interest_photography'],
  },
  {
    id: 'u2',
    name: 'Kenji',
    username: 'kenji_travels',
    profilePicture: 'https://i.pravatar.cc/200?img=12',
    coverMode: 'auto',
    homeCityId: 'tokyo-jp',
    status: {
      kind: 'planning',
      city: 'Rome',
      country: 'Italy',
      month: '2026-12',
      sharing: { closeFriends: 'full', everyone: 'country' },
    },
    closeFriendIds: [],
    interestIds: ['interest_food', 'interest_photography'],
  },
  {
    id: 'u3',
    name: 'Amara',
    username: 'amara',
    profilePicture: 'https://i.pravatar.cc/200?img=32',
    bio: 'New here!',
    coverMode: 'auto',
    homeCityId: 'lagos-ng',
    status: { kind: 'home', sharing: { closeFriends: 'full', everyone: 'country' } },
    closeFriendIds: [],
    interestIds: ['interest_museums', 'interest_hiking'],
  },
];

// One profile by its id, or null if there isn't one
export async function getProfile(id: string): Promise<Profile | null> {
  return mockRequest(mockUsers.find((user) => user.id === id) ?? null);
}

// Whether a username is free to take. Usernames are stored lowercase, so the
// check is case-insensitive. `excludingUserId` lets a profile keep its own
// current username without it flagging as taken while editing.
export async function isUsernameAvailable(username: string, excludingUserId?: string): Promise<boolean> {
  const normalized = username.trim().toLowerCase();
  const taken = mockUsers.some((user) => user.username === normalized && user.id !== excludingUserId);
  return mockRequest(!taken);
}

// Trims a single status down to one sharing level. Pulled out of
// getVisibleStatus so the Edit profile status panel can show live "Close
// friends see: ..." / "Everyone sees: ..." previews without needing a full
// Profile to trim against.
export function trimStatusForLevel(status: TravelStatus, level: StatusDetail): VisibleTravelStatus | null {
  if (level === 'hidden') return null;
  if (status.kind === 'home') return status;

  const city = level === 'country' ? undefined : status.city;

  if (status.kind === 'traveling') {
    return { kind: 'traveling', country: status.country, city, until: level === 'full' ? status.until : undefined };
  }

  return { kind: 'planning', country: status.country, city, month: level === 'full' ? status.month : undefined };
}

// Trims a profile's status down to what a given viewer is allowed to see.
// The viewer sees their own status in full; everyone else gets the detail
// level the profile owner picked for close friends vs. everyone else.
// Anything that displays a status (cover photo, suggested-friends scoring,
// later trip-overlap) must read the status through this, never the raw field.
export function getVisibleStatus(profile: Profile, viewerId: string): VisibleTravelStatus | null {
  if (viewerId === profile.id) return profile.status;

  const level = profile.closeFriendIds.includes(viewerId)
    ? profile.status.sharing.closeFriends
    : profile.status.sharing.everyone;

  return trimStatusForLevel(profile.status, level);
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
    other.interestIds.filter((id) => me.interestIds.includes(id)).length + (sameTravelCountry(other) ? 1 : 0);

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