// Profiles, from Supabase. The mock users now live in supabase/seed/10_people.sql.
//
// Privacy happens in the database: your own profile comes back with your full
// travel status and home city; anyone else's comes back already trimmed to what
// you're allowed to see (visible_status and visible_home), so the phone never
// receives more than it shows (docs/backend-plan.md).

import { currentUserId, supabase } from '@/lib/supabase';

import { getMediaUrl, isLocalPhoto, mediaPathFrom, uploadMedia, type MediaFolder } from './media';

import type { Database } from '@/types/database';
import type { OwnTravelStatus, Profile, StatusDetail, TravelGoal, VisibleTravelStatus } from '@/types/profile';

const PROFILE_SELECT =
  'id, username, name, bio, avatar_path, avatar_hue, cover_mode, cover_path, dream_trip_city_id, visible_status, visible_home, interests:profile_interests(interest_id), goals:travel_goals(year, metric, target)';

// Your own location row, with the status city's name (it has two links to
// cities, so the foreign key is named).
const LOCATION_SELECT =
  'home_city_id, status_kind, status_until, status_month, share_close_friends, share_everyone, status_city:cities!profile_locations_status_city_id_fkey(name, country)';

type ProfileRow = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar_path: string | null;
  avatar_hue: number | null;
  cover_mode: string;
  cover_path: string | null;
  dream_trip_city_id: string | null;
  visible_status: unknown;
  visible_home: unknown;
  interests?: { interest_id: string }[];
  goals?: { year: number; metric: string; target: number }[];
};

type LocationRow = {
  home_city_id: string | null;
  status_kind: string;
  status_until: string | null;
  status_month: string | null;
  share_close_friends: string;
  share_everyone: string;
  status_city: { name: string; country: string } | null;
};

function toOwnStatus(location: LocationRow): OwnTravelStatus {
  const sharing = {
    closeFriends: location.share_close_friends as StatusDetail,
    everyone: location.share_everyone as StatusDetail,
  };
  const city = location.status_city;
  if (location.status_kind === 'traveling' && city) {
    return { kind: 'traveling', city: city.name, country: city.country, until: location.status_until ?? undefined, sharing };
  }
  if (location.status_kind === 'planning' && city) {
    return { kind: 'planning', city: city.name, country: city.country, month: location.status_month?.slice(0, 7), sharing };
  }
  return { kind: 'home', sharing };
}

function toProfile(row: ProfileRow, ownLocation?: LocationRow | null): Profile {
  const visibleHome = row.visible_home as { city_id?: string } | null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    profilePicture: getMediaUrl(row.avatar_path),
    avatarHue: row.avatar_hue ?? undefined,
    bio: row.bio ?? undefined,
    coverMode: row.cover_mode as Profile['coverMode'],
    coverImage: getMediaUrl(row.cover_path),
    homeCityId: ownLocation ? (ownLocation.home_city_id ?? undefined) : visibleHome?.city_id,
    dreamTripCityId: row.dream_trip_city_id ?? undefined,
    status: ownLocation ? toOwnStatus(ownLocation) : undefined,
    visibleStatus: (row.visible_status as VisibleTravelStatus | null) ?? null,
    goals: row.goals?.map((goal) => ({ year: goal.year, metric: goal.metric as TravelGoal['metric'], target: goal.target })),
    interestIds: row.interests?.map((item) => item.interest_id) ?? [],
  };
}

// One profile by its id, or null if there isn't one (or they blocked you).
export async function getProfile(id: string): Promise<Profile | null> {
  const me = await currentUserId();
  const [profileResult, locationResult] = await Promise.all([
    supabase.from('profiles').select(PROFILE_SELECT).eq('id', id).maybeSingle(),
    id === me
      ? supabase.from('profile_locations').select(LOCATION_SELECT).eq('user_id', id).maybeSingle()
      : Promise.resolve(null),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (locationResult?.error) throw locationResult.error;
  if (!profileResult.data) return null;
  return toProfile(
    profileResult.data as unknown as ProfileRow,
    (locationResult?.data as unknown as LocationRow | null) ?? null,
  );
}

// Several people at once, e.g. your blocked accounts or your followers, in the
// same order as the ids. Anyone who blocked you is left out.
export async function getProfilesByIds(ids: string[]): Promise<Profile[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT).in('id', unique);
  if (error) throw error;
  const byId = new Map((data as unknown as ProfileRow[]).map((row) => [row.id, toProfile(row)]));
  return unique.flatMap((id) => byId.get(id) ?? []);
}

// Whether a username is free to take. Usernames are stored lowercase, so the
// check ignores case, and your own current username counts as free. Works
// signed out, for Create account.
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_username_available', { username: username.trim().toLowerCase() });
  if (error) throw error;
  return data;
}

export type SuggestedFriend = { profile: Profile; reason?: string };

// People the signed-in user could follow, best first, each with the reason line
// under their name ("Also in Lisbon", "3 mutuals"). The database leaves out
// people you follow or blocked, and anyone who turned suggestions off.
export async function getSuggestedFriends(): Promise<SuggestedFriend[]> {
  const { data, error } = await supabase
    .rpc('suggested_friends', { max_results: 10 })
    .select(`${PROFILE_SELECT}, suggestion_reason`);
  if (error) throw error;
  return (data as unknown as (ProfileRow & { suggestion_reason: string | null })[]).map((row) => ({
    profile: toProfile(row),
    reason: row.suggestion_reason ?? undefined,
  }));
}

// The usernames of the people the signed-in user follows, e.g. to tell which
// reviews came from friends.
export async function getFriendUsernames(): Promise<string[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('follows')
    .select('following:profiles!follows_following_id_fkey(username)')
    .eq('follower_id', userId);
  if (error) throw error;
  return (data as unknown as { following: { username: string } | null }[]).flatMap((row) =>
    row.following ? [row.following.username] : [],
  );
}

// A photo from an edit screen, as a value for the database: a new photo from
// the phone is uploaded first; an unchanged one goes back to its path.
async function photoPath(value: string | undefined, folder: MediaFolder): Promise<string | null> {
  if (!value) return null;
  return isLocalPhoto(value) ? uploadMedia(value, folder) : mediaPathFrom(value);
}

// A status city is picked from the city list, so it's always there.
async function cityIdFor(name: string, country: string): Promise<string> {
  const { data, error } = await supabase
    .from('cities')
    .select('id')
    .ilike('name', name)
    .ilike('country', country)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Pick ${name} from the city list.`);
  return data.id;
}

export type ProfileChanges = Partial<Omit<Profile, 'id' | 'visibleStatus'>>;

// Saves changes to the signed-in user's profile and returns it. Each field goes
// to its own table: the profile itself, profile_locations (home and status),
// profile_interests and travel_goals.
export async function updateProfile(changes: ProfileChanges): Promise<Profile | null> {
  const me = await currentUserId();

  const profile: Database['public']['Tables']['profiles']['Update'] = {};
  if (changes.name !== undefined) profile.name = changes.name.trim();
  if (changes.username !== undefined) profile.username = changes.username.trim().toLowerCase();
  if ('bio' in changes) profile.bio = changes.bio?.trim() || null;
  if ('avatarHue' in changes) profile.avatar_hue = changes.avatarHue ?? null;
  if (changes.coverMode !== undefined) profile.cover_mode = changes.coverMode;
  if ('dreamTripCityId' in changes) profile.dream_trip_city_id = changes.dreamTripCityId ?? null;
  if ('profilePicture' in changes) profile.avatar_path = await photoPath(changes.profilePicture, 'avatar');
  if ('coverImage' in changes) profile.cover_path = await photoPath(changes.coverImage, 'cover');

  const location: Database['public']['Tables']['profile_locations']['Update'] = {};
  if ('homeCityId' in changes) location.home_city_id = changes.homeCityId ?? null;
  if (changes.status) {
    const status = changes.status;
    location.status_kind = status.kind;
    location.status_city_id = status.kind === 'home' ? null : await cityIdFor(status.city, status.country);
    location.status_until = status.kind === 'traveling' ? (status.until ?? null) : null;
    location.status_month = status.kind === 'planning' && status.month ? `${status.month}-01` : null;
    location.share_close_friends = status.sharing.closeFriends;
    location.share_everyone = status.sharing.everyone;
  }

  if (Object.keys(profile).length > 0) {
    const { error } = await supabase.from('profiles').update(profile).eq('id', me);
    if (error) throw error;
  }
  if (Object.keys(location).length > 0) {
    const { error } = await supabase.from('profile_locations').update(location).eq('user_id', me);
    if (error) throw error;
  }

  if (changes.interestIds) {
    const { data: current, error } = await supabase.from('profile_interests').select('interest_id').eq('profile_id', me);
    if (error) throw error;
    const had = new Set(current.map((row) => row.interest_id));
    const wanted = new Set(changes.interestIds);
    const removed = [...had].filter((id) => !wanted.has(id));
    const added = [...wanted].filter((id) => !had.has(id));
    if (removed.length > 0) {
      const { error: removeError } = await supabase
        .from('profile_interests')
        .delete()
        .eq('profile_id', me)
        .in('interest_id', removed);
      if (removeError) throw removeError;
    }
    if (added.length > 0) {
      const { error: addError } = await supabase
        .from('profile_interests')
        .insert(added.map((interestId) => ({ interest_id: interestId })));
      if (addError) throw addError;
    }
  }

  if (changes.goals && changes.goals.length > 0) {
    const { error } = await supabase.from('travel_goals').upsert(
      changes.goals.map((goal) => ({ user_id: me, year: goal.year, metric: goal.metric, target: goal.target })),
      { onConflict: 'user_id,year' },
    );
    if (error) throw error;
  }

  return getProfile(me);
}
