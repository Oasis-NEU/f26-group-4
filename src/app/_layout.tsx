import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';

import { BadgeCelebrationHost } from '@/components/badge-celebration';
import { SessionProvider, useSession } from '@/hooks/use-session';
import { PERSIST_MAX_AGE, queryClient, queryPersister } from '@/lib/query-client';

// The app's outermost navigator. The tab bar itself is set up in (tabs)/_layout.tsx.
//
// Route to login, onboarding, or the main app based on the signed-in session.
// QueryClientProvider holds the React Query cache that every hook in
// src/hooks/ reads from (docs/data-layer.md).
//
// Screens listed here cover the WHOLE screen, tab bar included. That's right
// for things you start, finish and leave -- posting, editing your profile,
// settings, signing in.
//
// It is NOT right for things you browse. A place, a collection, someone's
// profile and the New collection form all used to be listed here, which meant
// the tab bar vanished as soon as you opened one. They now live inside each
// tab's own stack, in src/app/(tabs)/(profile,map,explore,saved)/, so the tab
// bar stays put and you always have a back arrow.
export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE }}>
      <SessionProvider>
        <RootStack />
      </SessionProvider>
    </PersistQueryClientProvider>
  );
}

function RootStack() {
  const { user, isLoading } = useSession();

  const needsOnboarding = user?.user_metadata.onboarding_pending === true;

  const previewUpload = __DEV__ && process.env.EXPO_PUBLIC_PREVIEW_UPLOAD === 'true' && !user;

  // Wait for the saved session, so a signed-in person doesn't see Login flash first.
  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ title: 'Log in' }} />
          <Stack.Screen name="create-account" options={{ title: 'Create account' }} />
        </Stack.Protected>

        <Stack.Protected guard={!!user && needsOnboarding}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!!user && !needsOnboarding}>
          <Stack.Screen name="edit-profile" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={previewUpload || (!!user && !needsOnboarding)}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="upload" options={{ title: 'Upload', presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>

      {/* Floats over whatever screen is on top -- see badge-celebration.tsx. */}
      {!!user && !needsOnboarding && <BadgeCelebrationHost />}
    </>
  );
}
