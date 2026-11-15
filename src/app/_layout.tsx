import { Stack } from 'expo-router';

// The app's outermost navigator. The tab bar itself is set up in (tabs)/_layout.tsx.
//
// Screens listed here cover the WHOLE screen, tab bar included. That's right
// for things you start, finish and leave -- posting, editing your profile,
// settings, signing in.
//
// It is NOT right for things you browse. A place, a collection and the New
// collection form all used to be listed here, which meant the tab bar vanished
// as soon as you opened one. They now live inside each tab's own stack, in
// src/app/(tabs)/(profile,map,feed,saved,explore)/, so the tab bar stays put
// and you always have a back arrow.
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="upload" options={{ title: 'Upload', presentation: 'modal' }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Log in' }} />
      <Stack.Screen name="create-account" options={{ title: 'Create account' }} />
    </Stack>
  );
}
