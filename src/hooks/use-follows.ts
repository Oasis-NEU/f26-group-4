// Following: follower lists, the 📥 inbox, suggestions, and the follow buttons.
import { skipToken, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import {
  acceptFollowRequest,
  declineFollowRequest,
  followUser,
  getFollowerIds,
  getFollowingIds,
  getFollowRequests,
  unfollowUser,
} from '@/services/follows';
import { getFriendUsernames, getSuggestedFriends } from '@/services/users';

export function useFollowerIds(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.follows.followers(userId ?? ''),
    queryFn: userId ? () => getFollowerIds(userId) : skipToken,
  });
}

export function useFollowingIds(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.follows.following(userId ?? ''),
    queryFn: userId ? () => getFollowingIds(userId) : skipToken,
  });
}

// The follow requests waiting on the signed-in user, newest first, with who sent them.
export function useFollowRequests() {
  return useQuery({ queryKey: queryKeys.follows.requests, queryFn: getFollowRequests });
}

// People the signed-in user might follow, each with the reason line under their name.
export function useSuggestedFriends() {
  return useQuery({ queryKey: queryKeys.follows.suggestions, queryFn: getSuggestedFriends });
}

// The usernames of the people the signed-in user follows (the Map shows their photos first).
export function useFriendUsernames() {
  return useQuery({ queryKey: queryKeys.follows.friendUsernames, queryFn: getFriendUsernames });
}

// A follow changes lists, counts, suggestions and friends' ratings, so all of them refresh.
function refreshAfterFollowChange(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.follows.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.places.all });
}

// Follows someone, or sends a request if their account is friends-only.
// The result is 'following' or 'requested'.
export function useFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onSettled: () => refreshAfterFollowChange(queryClient),
  });
}

// Stops following someone, and cancels a request that's still waiting.
export function useUnfollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onSettled: () => refreshAfterFollowChange(queryClient),
  });
}

export function useAcceptFollowRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fromId: string) => acceptFollowRequest(fromId),
    onSettled: () => refreshAfterFollowChange(queryClient),
  });
}

export function useDeclineFollowRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fromId: string) => declineFollowRequest(fromId),
    onSettled: () => refreshAfterFollowChange(queryClient),
  });
}
