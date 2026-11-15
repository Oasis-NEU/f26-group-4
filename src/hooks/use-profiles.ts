// Profiles: anyone's profile, several at once, editing your own, and the
// username check.
import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { queryKeys } from '@/lib/query-keys';
import { getProfile, getProfilesByIds, isUsernameAvailable, updateProfile, type ProfileChanges } from '@/services/users';

// One profile. Yours has your full status; anyone else's comes back already
// trimmed by the database. Waits while there's no id yet.
export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(id ?? ''),
    queryFn: id ? () => getProfile(id) : skipToken,
  });
}

// Several profiles in one request, in the order of the ids, e.g. your
// followers or blocked accounts. When the ids change, the old list stays on
// screen until the new one arrives.
export function useProfilesByIds(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.profiles.byIds(ids),
    queryFn: () => getProfilesByIds(ids),
    placeholderData: keepPreviousData,
  });
}

// Saves changes to the signed-in user's profile. Interests and status also
// change suggestions, so those refresh too. The mutation stays pending until
// the fresh profile has loaded, so a screen can show `variables` until then.
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes: ProfileChanges) => updateProfile(changes),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.interests.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.follows.suggestions }),
      ]),
  });
}

// Returns a function that checks whether a username is free (your own current
// one counts as free). Works signed out, for Create account. The same name
// isn't asked twice in a row.
export function useCheckUsername(): (username: string) => Promise<boolean> {
  const queryClient = useQueryClient();
  return useCallback(
    (username: string) => {
      const wanted = username.trim().toLowerCase();
      return queryClient.fetchQuery({
        queryKey: queryKeys.profiles.usernameAvailable(wanted),
        queryFn: () => isUsernameAvailable(wanted),
        staleTime: 5_000,
      });
    },
    [queryClient],
  );
}
