// Who follows whom, and the follow-request inbox for friends-only accounts,
// from Supabase. The mock follows now live in supabase/seed/40_following.sql.
//
// The database keeps these rules: following a friends-only account sends a
// request instead; accepting turns the request into a follow; turning
// friends-only off accepts every waiting request; blocking someone ends follows
// and requests both ways.

import { currentUserId, supabase } from '@/lib/supabase';

import { getMediaUrl } from './media';

export type Follow = {
  followerId: string;
  followingId: string;
  notifyPosts: boolean; // the 🔔 on the followed person's profile: notify on a new place
  notifyStatus: boolean; // notify when they update their travel status
};

// A request waiting on the signed-in user, with who sent it, for the 📥 inbox.
export type FollowRequest = {
  fromId: string;
  createdAt: string; // e.g. "2026-11-05"
  name: string;
  username: string;
  photoUrl?: string;
  avatarHue?: number;
  reason?: string; // "Also in Lisbon", "3 mutuals"
};

// IDs of everyone who follows this user. Empty when they hide their follow
// lists from you; their follower count still shows (profiles.follower_count).
export async function getFollowerIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
  if (error) throw error;
  return data.map((row) => row.follower_id);
}

// IDs of everyone this user follows.
export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
  if (error) throw error;
  return data.map((row) => row.following_id);
}

// Whether the signed-in user follows this person.
export async function isFollowing(userId: string): Promise<boolean> {
  const me = await currentUserId();
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', me)
    .eq('following_id', userId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// Follows a public account, or sends a request to a friends-only one.
export async function followUser(userId: string): Promise<'following' | 'requested'> {
  const { data, error } = await supabase.rpc('follow', { person: userId });
  if (error) throw error;
  return data === 'requested' ? 'requested' : 'following';
}

// Stops following someone, and cancels a request that's still waiting.
// Unfollowing also turns off both notify switches, since the follow row goes.
export async function unfollowUser(userId: string): Promise<void> {
  const me = await currentUserId();
  const [unfollow, cancel] = await Promise.all([
    supabase.from('follows').delete().eq('follower_id', me).eq('following_id', userId),
    supabase.from('follow_requests').delete().eq('from_id', me).eq('to_id', userId),
  ]);
  if (unfollow.error) throw unfollow.error;
  if (cancel.error) throw cancel.error;
}

// Used by NotifyBell: the signed-in user's notify switches for someone they follow.
export async function setNotifyPrefs(
  userId: string,
  prefs: Partial<Pick<Follow, 'notifyPosts' | 'notifyStatus'>>,
): Promise<void> {
  const me = await currentUserId();
  const changes: { notify_posts?: boolean; notify_status?: boolean } = {};
  if (prefs.notifyPosts !== undefined) changes.notify_posts = prefs.notifyPosts;
  if (prefs.notifyStatus !== undefined) changes.notify_status = prefs.notifyStatus;
  const { error } = await supabase.from('follows').update(changes).eq('follower_id', me).eq('following_id', userId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Inbox: follow requests for friends-only accounts
// ---------------------------------------------------------------------------

// The requests waiting on the signed-in user, newest first.
export async function getFollowRequests(): Promise<FollowRequest[]> {
  const me = await currentUserId();
  const { data, error } = await supabase
    .from('follow_requests')
    .select(
      'from_id, created_at, from:profiles!follow_requests_from_id_fkey(name, username, avatar_path, avatar_hue, suggestion_reason)',
    )
    .eq('to_id', me)
    .order('created_at', { ascending: false });
  if (error) throw error;

  type Row = {
    from_id: string;
    created_at: string;
    from: {
      name: string;
      username: string;
      avatar_path: string | null;
      avatar_hue: number | null;
      suggestion_reason: string | null;
    } | null;
  };
  return (data as unknown as Row[]).flatMap((row) =>
    row.from
      ? [
          {
            fromId: row.from_id,
            createdAt: row.created_at.slice(0, 10),
            name: row.from.name,
            username: row.from.username,
            photoUrl: getMediaUrl(row.from.avatar_path),
            avatarHue: row.from.avatar_hue ?? undefined,
            reason: row.from.suggestion_reason ?? undefined,
          },
        ]
      : [],
  );
}

// Accepting creates the follow and removes the request.
export async function acceptFollowRequest(fromId: string): Promise<void> {
  const { error } = await supabase.rpc('accept_follow_request', { from_user: fromId });
  if (error) throw error;
}

// Declining just removes the request -- no follow is created.
export async function declineFollowRequest(fromId: string): Promise<void> {
  const me = await currentUserId();
  const { error } = await supabase.from('follow_requests').delete().eq('from_id', fromId).eq('to_id', me);
  if (error) throw error;
}
