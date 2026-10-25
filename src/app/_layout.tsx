import { Stack } from 'expo-router';

// The app's outermost navigator. The tab bar itself is set up in (tabs)/_layout.tsx.
// Screens listed here open on top of the tabs, with a back button, instead of being a tab.
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="place/[id]" options={{ title: 'Place' }} />
      <Stack.Screen name="login" options={{ title: 'Log in' }} />
      <Stack.Screen name="create-account" options={{ title: 'Create account' }} />
    </Stack>
  );
}
