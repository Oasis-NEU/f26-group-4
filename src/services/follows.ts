// Who follows whom, and the follow-request inbox for Friends-only accounts.
// Fake data for now, same idea as users.ts: when Supabase is set up, only this file changes.

import { mockRequest } from './mock-backend';

export type Follow = {
  followerId: string;
  followingId: string;
  notifyPosts: boolean; // the 🔔 on the followed person's profile: notify on a new place
  notifyStatus: boolean; // notify when they update their travel status
};

export type FollowRequest = {
  fromId: string;
  toId: string;
  createdAt: string; // e.g. "2026-11-05"
};

const mockFollows: Follow[] = [
  { followerId: 'u2', followingId: 'u1', notifyPosts: false, notifyStatus: false },
  { followerId: 'u1', followingId: 'u2', notifyPosts: true, notifyStatus: false },
];

const mockFollowRequests: FollowRequest[] = [
  { fromId: 'u3', toId: 'u1', createdAt: '2026-11-05' },
];

// IDs of everyone who follows this user.
export async function getFollowerIds(userId: string): Promise<string[]> {
  return mockRequest(mockFollows.filter((f) => f.followingId === userId).map((f) => f.followerId));
}

// IDs of everyone this user follows.
export async function getFollowingIds(userId: string): Promise<string[]> {
  return mockRequest(mockFollows.filter((f) => f.followerId === userId).map((f) => f.followingId));
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  return mockRequest(mockFollows.some((f) => f.followerId === followerId && f.followingId === followingId));
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const exists = mockFollows.some((f) => f.followerId === followerId && f.followingId === followingId);
  if (!exists) {
    mockFollows.push({ followerId, followingId, notifyPosts: false, notifyStatus: false });
  }
  return mockRequest(undefined);
}

// Unfollowing also turns off both notify switches, since the bell disappears with it.
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const index = mockFollows.findIndex((f) => f.followerId === followerId && f.followingId === followingId);
  if (index !== -1) mockFollows.splice(index, 1);
  return mockRequest(undefined);
}

// Used by NotifyBell. Only the follower can set their own notify prefs for someone they follow.
export async function setNotifyPrefs(
  followerId: string,
  followingId: string,
  prefs: Partial<Pick<Follow, 'notifyPosts' | 'notifyStatus'>>,
): Promise<Follow | null> {
  const follow = mockFollows.find((f) => f.followerId === followerId && f.followingId === followingId);
  if (!follow) return mockRequest(null);
  Object.assign(follow, prefs);
  return mockRequest(follow);
}

// ---------------------------------------------------------------------------
// Inbox: follow requests for Friends-only accounts
// ---------------------------------------------------------------------------

// The requests waiting on this user, newest first.
export async function getFollowRequests(userId: string): Promise<FollowRequest[]> {
  const requests = mockFollowRequests
    .filter((r) => r.toId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return mockRequest(requests);
}

// Accepting creates the follow and removes the request.
export async function acceptFollowRequest(userId: string, fromId: string): Promise<void> {
  const index = mockFollowRequests.findIndex((r) => r.toId === userId && r.fromId === fromId);
  if (index !== -1) mockFollowRequests.splice(index, 1);
  await followUser(fromId, userId);
  return mockRequest(undefined);
}

// Declining just removes the request -- no follow is created.
export async function declineFollowRequest(userId: string, fromId: string): Promise<void> {
  const index = mockFollowRequests.findIndex((r) => r.toId === userId && r.fromId === fromId);
  if (index !== -1) mockFollowRequests.splice(index, 1);
  return mockRequest(undefined);
}

// Turning Friends-only off accepts every request waiting on this user at once.
export async function acceptAllFollowRequests(userId: string): Promise<void> {
  const waiting = await getFollowRequests(userId);
  for (const request of waiting) {
    await acceptFollowRequest(userId, request.fromId);
  }
  return mockRequest(undefined);
}
