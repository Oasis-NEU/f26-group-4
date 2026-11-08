// The React Query cache: the app's copy of what's in the database
// (docs/data-layer.md). Screens read it through the hooks in src/hooks/.
import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // reuse data for 30 seconds before refetching it
      retry: 1,
    },
  },
});

// Refetch stale data when the app comes back to the foreground. The web does this by itself.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
}
