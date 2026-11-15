import { router, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { colors } from '@/theme';

// Settings' own Stack, so each page gets a native back button + title without
// the root layout needing to know about every settings screen individually.
//
// Every sub-page below just uses the plain default headerLeft -- React
// Navigation already draws a working back button for them on its own, since
// index.tsx exists before them in this stack's own history.
//
// index is the one exception: it's the FIRST screen in this stack, so there's
// nothing within the stack for an automatic back button to point to, and the
// root stack never draws a header for "settings" at all (headerShown: false
// there, so this stack's own headers show instead, not a second one on top).
// Without a plain back arrow here, the main Settings page has no way back to
// Profile at all.
function backToProfile() {
  // router.back() only works if there's a screen to go back TO. A direct link
  // to /settings (a refreshed browser tab, a bookmark) has no history, so this
  // falls back to Profile directly -- same pattern as PlaceDetails' own Back button.
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/profile');
  }
}

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerLeft: () => (
            <Pressable onPress={backToProfile} hitSlop={8}>
              <Text style={{ fontSize: 24, color: colors.text }}>‹</Text>
            </Pressable>
          ),
        }}
      />
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
