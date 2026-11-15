// The signed-in user's settings, from Supabase. Only ever the signed-in user's
// own: row level security won't hand anyone else's to the app.
//
// The app's Settings type is put together from four places: the settings row,
// profiles.account_type (other people need it, to show Follow or Request), and
// the close_friends and blocks tables.

import { currentUserId, supabase } from '@/lib/supabase';

import type { Database } from '@/types/database';
import type { StatusDetail } from '@/types/profile';
import type { Audience, Settings } from '@/types/settings';

type SettingsUpdate = Database['public']['Tables']['settings']['Update'];

const MAP_VISIBILITY_TO_APP: Record<string, Audience> = {
  everyone: 'everyone',
  close_friends: 'closeFriends',
  only_me: 'onlyMe',
};
const MAP_VISIBILITY_TO_DB: Record<Audience, string> = {
  everyone: 'everyone',
  closeFriends: 'close_friends',
  onlyMe: 'only_me',
};

export async function getSettings(): Promise<Settings> {
  const me = await currentUserId();
  const [settings, profile, closeFriends, blocks] = await Promise.all([
    supabase.from('settings').select('*').eq('user_id', me).single(),
    supabase.from('profiles').select('account_type').eq('id', me).single(),
    supabase.from('close_friends').select('friend_id').eq('owner_id', me),
    supabase.from('blocks').select('blocked_id').eq('blocker_id', me),
  ]);
  if (settings.error) throw settings.error;
  if (profile.error) throw profile.error;
  if (closeFriends.error) throw closeFriends.error;
  if (blocks.error) throw blocks.error;

  const row = settings.data;
  return {
    userId: me,
    accountType: profile.data.account_type === 'friends_only' ? 'friendsOnly' : 'public',
    defaultStatusSharing: {
      closeFriends: row.default_share_close_friends as StatusDetail,
      everyone: row.default_share_everyone as StatusDetail,
    },
    closeFriendIds: closeFriends.data.map((item) => item.friend_id),
    mapVisibility: MAP_VISIBILITY_TO_APP[row.map_visibility] ?? 'everyone',
    homeVisibility: row.home_visibility as Settings['homeVisibility'],
    followListsVisibility: row.follow_lists_visibility === 'only_me' ? 'onlyMe' : 'everyone',
    newCollectionsPrivate: row.new_collections_private,
    showInSuggestions: row.show_in_suggestions,
    findableByContact: row.findable_by_contact,
    blockedIds: blocks.data.map((item) => item.blocked_id),
    notifications: {
      paused: row.notifications_paused,
      newFollower: row.notify_new_follower,
      likesAndComments: row.notify_likes_comments,
      closeFriendStatus: row.notify_close_friend_status,
      tripOverlap: row.notify_trip_overlap,
    },
  };
}

// Settings save instantly when a control is tapped -- the screen updates
// first and calls this in the background; on failure the screen is
// responsible for flipping the control back and showing an error.
// Close friends and blocks have their own functions below.
export async function updateSettings(changes: Partial<Omit<Settings, 'userId'>>): Promise<Settings> {
  const me = await currentUserId();

  const row: SettingsUpdate = {};
  if (changes.defaultStatusSharing) {
    row.default_share_close_friends = changes.defaultStatusSharing.closeFriends;
    row.default_share_everyone = changes.defaultStatusSharing.everyone;
  }
  if (changes.mapVisibility) row.map_visibility = MAP_VISIBILITY_TO_DB[changes.mapVisibility];
  if (changes.homeVisibility) row.home_visibility = changes.homeVisibility;
  if (changes.followListsVisibility) {
    row.follow_lists_visibility = changes.followListsVisibility === 'onlyMe' ? 'only_me' : 'everyone';
  }
  if (changes.newCollectionsPrivate !== undefined) row.new_collections_private = changes.newCollectionsPrivate;
  if (changes.showInSuggestions !== undefined) row.show_in_suggestions = changes.showInSuggestions;
  if (changes.findableByContact !== undefined) row.findable_by_contact = changes.findableByContact;
  if (changes.notifications) {
    row.notifications_paused = changes.notifications.paused;
    row.notify_new_follower = changes.notifications.newFollower;
    row.notify_likes_comments = changes.notifications.likesAndComments;
    row.notify_close_friend_status = changes.notifications.closeFriendStatus;
    row.notify_trip_overlap = changes.notifications.tripOverlap;
  }

  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from('settings').update(row).eq('user_id', me);
    if (error) throw error;
  }
  // Turning friends-only off also accepts every waiting request (a database rule).
  if (changes.accountType) {
    const { error } = await supabase
      .from('profiles')
      .update({ account_type: changes.accountType === 'friendsOnly' ? 'friends_only' : 'public' })
      .eq('id', me);
    if (error) throw error;
  }

  return getSettings();
}

// The friend has to follow you already.
export async function addCloseFriend(friendId: string): Promise<Settings> {
  const { error } = await supabase.from('close_friends').insert({ friend_id: friendId });
  if (error && error.code !== '23505') throw error; // 23505: already a close friend
  return getSettings();
}

export async function removeCloseFriend(friendId: string): Promise<Settings> {
  const me = await currentUserId();
  const { error } = await supabase.from('close_friends').delete().eq('owner_id', me).eq('friend_id', friendId);
  if (error) throw error;
  return getSettings();
}

// Blocking also ends follows, requests and close-friend entries between you, both ways.
export async function blockUser(blockedId: string): Promise<Settings> {
  const { error } = await supabase.from('blocks').insert({ blocked_id: blockedId });
  if (error && error.code !== '23505') throw error; // 23505: already blocked
  return getSettings();
}

export async function unblockUser(blockedId: string): Promise<Settings> {
  const me = await currentUserId();
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', blockedId);
  if (error) throw error;
  return getSettings();
}
