import { getFollowerIds, getFollowingIds } from './follows';
import { mockRequest } from './mock-backend';
import { getSettings } from './settings';

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
// `closeFriendIds` is the profile owner's own list (now stored in Settings,
// not on Profile) -- callers fetch it via getSettings(profile.id) first, so
// this function stays synchronous and Settings data never leaks further than
// whoever already has permission to read it.
// Anything that displays a status (cover photo, suggested-friends scoring,
// later trip-overlap) must read the status through this, never the raw field.
export function getVisibleStatus(profile: Profile, viewerId: string, closeFriendIds: string[]): VisibleTravelStatus | null {
  if (viewerId === profile.id) return profile.status;

  const level = closeFriendIds.includes(viewerId) ? profile.status.sharing.closeFriends : profile.status.sharing.everyone;

  return trimStatusForLevel(profile.status, level);
}

// People the user could follow: everyone except themselves, people they
// already follow, and anyone they've blocked. Ones with shared interests or
// who are traveling in the same country (as far as the viewer can see) come first.
export async function getSuggestedFriends(userId: string): Promise<Profile[]> {
  const me = mockUsers.find((user) => user.id === userId);
  if (!me) return mockRequest([]);

  const others = mockUsers.filter((user) => user.id !== userId);

  // Everyone's settings fetched together in one round, instead of fetching
  // yours first and then each candidate's in a second, later round.
  const [mySettings, alreadyFollowing, othersSettings] = await Promise.all([
    getSettings(userId),
    getFollowingIds(userId),
    Promise.all(others.map((other) => getSettings(other.id))),
  ]);

  const myStatus = getVisibleStatus(me, userId, mySettings.closeFriendIds); // viewing yourself always returns the full status
  const settingsByUserId = new Map(others.map((other, index) => [other.id, othersSettings[index]]));

  const sameTravelCountry = (other: Profile) => {
    const otherCloseFriendIds = settingsByUserId.get(other.id)!.closeFriendIds;
    const otherStatus = getVisibleStatus(other, userId, otherCloseFriendIds);
    return myStatus?.kind === 'traveling' && otherStatus?.kind === 'traveling' && otherStatus.country === myStatus.country;
  };

  const candidates = others.filter(
    (user) => !alreadyFollowing.includes(user.id) && !mySettings.blockedIds.includes(user.id),
  );

  const scored = candidates.map((other) => ({
    profile: other,
    score: other.interestIds.filter((id) => me.interestIds.includes(id)).length + (sameTravelCountry(other) ? 1 : 0),
  }));

  // No mockRequest() wrap here -- the awaits above already paid the simulated
  // network delay; wrapping an already-fetched result in another one just
  // stacks a third round trip on top for no reason.
  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.profile);
}

// The reason line shown under a suggested friend's name, e.g. "Also in Lisbon"
// or "4 mutuals". Undefined when there's nothing noteworthy to say.
export async function getSuggestionReason(myId: string, other: Profile): Promise<string | undefined> {
  const me = mockUsers.find((user) => user.id === myId);
  if (!me) return undefined;

  // Fetched together up front (rather than only fetching followers if the
  // country check falls through) so this never takes more than one round trip.
  const [myCloseFriendIds, otherCloseFriendIds, myFollowers, otherFollowers] = await Promise.all([
    getSettings(myId).then((s) => s.closeFriendIds),
    getSettings(other.id).then((s) => s.closeFriendIds),
    getFollowerIds(myId),
    getFollowerIds(other.id),
  ]);

  const myStatus = getVisibleStatus(me, myId, myCloseFriendIds);
  const otherStatus = getVisibleStatus(other, myId, otherCloseFriendIds);

  if (
    myStatus &&
    myStatus.kind !== 'home' &&
    otherStatus &&
    otherStatus.kind !== 'home' &&
    otherStatus.country === myStatus.country
  ) {
    return otherStatus.city ? `Also in ${otherStatus.city}` : `Also in ${otherStatus.country}`;
  }

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