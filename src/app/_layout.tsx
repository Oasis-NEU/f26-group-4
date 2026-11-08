import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { SessionProvider, useSession } from '@/hooks/use-session';
import { queryClient } from '@/lib/query-client';

// The app's outermost navigator. The tab bar itself is set up in (tabs)/_layout.tsx.
// Screens listed here open on top of the tabs, with a back button, instead of being a tab.
//
// The two Stack.Protected groups are the login gate: signed out, only Log in and
// Create account exist; signed in, everything else does. Signing in or out flips
// the guards, and the router moves to the first screen that's allowed.
// QueryClientProvider holds the React Query cache that every hook in
// src/hooks/ reads from (docs/data-layer.md).
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootStack />
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootStack() {
  const { user, isLoading } = useSession();

  // Wait for the saved session, so a signed-in person doesn't see Login flash first.
  if (isLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ title: 'Log in' }} />
        <Stack.Screen name="create-account" options={{ title: 'Create account' }} />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="place/[id]" options={{ title: 'Place' }} />
        <Stack.Screen name="city/[id]" />
        <Stack.Screen name="collection/[id]" />
        <Stack.Screen name="upload" options={{ title: 'Upload', presentation: 'modal' }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
