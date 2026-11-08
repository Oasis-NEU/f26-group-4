import { Stack } from 'expo-router';

// Settings' own Stack, so each page gets a native back button + title without
// the root layout needing to know about every settings screen individually.
export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      <Stack.Screen name="close-friends" options={{ title: 'Close friends' }} />
      <Stack.Screen name="blocked" options={{ title: 'Blocked accounts' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="travel" options={{ title: 'Your travel' }} />
      <Stack.Screen name="help" options={{ title: 'Help & about' }} />
    </Stack>
  );
}
