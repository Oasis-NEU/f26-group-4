import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { checkBadges, getBadgesForProfile, getUnseenBadges, getUserBadges, markBadgeSeen } from '@/services/badges';

// Badge names/icons/descriptions are static data, not a backend call -- safe
// for screens and components to read directly, same as a query key.
export { BADGE_DEFINITIONS } from '@/services/badges';

// Your own progress.
export function useUserBadges() {
  return useQuery({ queryKey: queryKeys.badges.mine, queryFn: getUserBadges });
}

// Anyone's earned badges -- everyone's Badges tab (see the RLS policy:
// visible to everyone except people they've blocked). Waits while there's
// no id yet.
export function useBadgesForProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.badges.byProfile(userId ?? ''),
    queryFn: userId ? () => getBadgesForProfile(userId) : skipToken,
  });
}

// Badges earned since the pop-up last ran, oldest first -- what
// BadgeCelebrationHost shows.
export function useUnseenBadges() {
  return useQuery({ queryKey: queryKeys.badges.unseen, queryFn: getUnseenBadges });
}

// Re-runs every rule and saves anything newly earned. Call this from
// onSettled on an action that could earn a badge (see use-reviews.ts,
// use-profiles.ts, use-collections.ts), or once when the app opens.
export function useCheckBadges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkBadges,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.badges.all }),
  });
}

export function useMarkBadgeSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markBadgeSeen,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.badges.all }),
  });
}
