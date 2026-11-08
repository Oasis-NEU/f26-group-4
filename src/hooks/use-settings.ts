// The signed-in user's settings, close friends and blocked accounts.
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import {
  addCloseFriend,
  blockUser,
  getSettings,
  removeCloseFriend,
  unblockUser,
  updateSettings,
} from '@/services/settings';
import type { Settings } from '@/types/settings';

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings.all, queryFn: getSettings });
}

// Changes the cached settings straight away, before the save finishes, and
// returns what was there so a failed save can put it back.
async function changeCachedSettings(queryClient: QueryClient, change: (settings: Settings) => Settings) {
  await queryClient.cancelQueries({ queryKey: queryKeys.settings.all });
  const previous = queryClient.getQueryData<Settings>(queryKeys.settings.all);
  if (previous) {
    queryClient.setQueryData<Settings>(queryKeys.settings.all, change(previous));
  }
  return { previous };
}

function restoreCachedSettings(queryClient: QueryClient, previous: Settings | undefined) {
  queryClient.setQueryData(queryKeys.settings.all, previous);
}

// Settings change what other things show (friends-only accepts waiting
// requests, "Lives in" changes your profile), so those refresh too.
function refreshAfterSettingsChange(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.follows.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all });
}

// Saves a settings change. The control flips straight away and flips back if
// saving fails; check the mutation's `isError` to show a message.
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes: Partial<Omit<Settings, 'userId'>>) => updateSettings(changes),
    onMutate: (changes) => changeCachedSettings(queryClient, (settings) => ({ ...settings, ...changes })),
    onError: (_error, _changes, context) => restoreCachedSettings(queryClient, context?.previous),
    onSettled: () => refreshAfterSettingsChange(queryClient),
  });
}

type ToggleCloseFriend = { friendId: string; add: boolean };

// Adds or removes a close friend, straight away on screen.
export function useToggleCloseFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendId, add }: ToggleCloseFriend) => (add ? addCloseFriend(friendId) : removeCloseFriend(friendId)),
    onMutate: ({ friendId, add }) =>
      changeCachedSettings(queryClient, (settings) => ({
        ...settings,
        closeFriendIds: add
          ? [...settings.closeFriendIds, friendId]
          : settings.closeFriendIds.filter((id) => id !== friendId),
      })),
    onError: (_error, _variables, context) => restoreCachedSettings(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
  });
}

// Blocking also ends follows and requests between you (a database rule).
export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSettled: () => refreshAfterSettingsChange(queryClient),
  });
}

// Unblocks someone. They leave your blocked list straight away.
export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onMutate: (userId) =>
      changeCachedSettings(queryClient, (settings) => ({
        ...settings,
        blockedIds: settings.blockedIds.filter((id) => id !== userId),
      })),
    onError: (_error, _userId, context) => restoreCachedSettings(queryClient, context?.previous),
    onSettled: () => refreshAfterSettingsChange(queryClient),
  });
}
