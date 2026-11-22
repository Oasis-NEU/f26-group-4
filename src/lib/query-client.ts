// The React Query cache: the app's copy of what's in the database
// (docs/data-layer.md). Screens read it through the hooks in src/hooks/.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

// How long a persisted query is still trusted enough to show (and keep
// refetching behind) on a cold start, instead of being thrown away. Has to be
// at least this long, or React Query garbage-collects it from memory before
// it ever gets the chance to be written to storage.
export const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // reuse data for 30 seconds before refetching it
      gcTime: PERSIST_MAX_AGE,
      retry: 1,
    },
  },
});

// Restoring this on a cold start is what lets a screen render last time's
// data immediately instead of a blank skeleton, while a normal (stale)
// background refetch quietly brings it up to date. AsyncStorage is backed by
// localStorage on web, so the same persister works everywhere.
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'oasis-query-cache',
});

// Refetch stale data when the app comes back to the foreground. The web does this by itself.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
}
