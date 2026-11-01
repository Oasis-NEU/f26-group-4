import { Stack } from 'expo-router';

import { UserContextProvider } from '@/hooks/use-user';

// The app's outermost navigator. The tab bar itself is set up in (tabs)/_layout.tsx.
// Screens listed here open on top of the tabs, with a back button, instead of being a tab.
// UserContextProvider wraps everything, so every screen can call useUser().
export default function RootLayout() {
  return (
    <UserContextProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="place/[id]" options={{ title: 'Place' }} />
        <Stack.Screen name="upload" options={{ title: 'Upload', presentation: 'modal' }} />
        <Stack.Screen name="login" options={{ title: 'Log in' }} />
        <Stack.Screen name="create-account" options={{ title: 'Create account' }} />
      </Stack>
    </UserContextProvider>
  );
}
