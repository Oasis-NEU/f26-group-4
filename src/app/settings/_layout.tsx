import { router, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { colors } from '@/theme';

// Settings' own Stack, so each page gets a native back button + title without
// the root layout needing to know about every settings screen individually.
//
// Every screen here gets its OWN headerLeft rather than relying on React
// Navigation's automatic one. For index that's the only option (it's the
// FIRST screen in this stack, so there's nothing within the stack for an
// automatic back button to point to, and the root stack never draws a header
// for "settings" at all -- headerShown: false there, so this stack's own
// headers show instead, not a second one on top).
//
// For the rest, it's for thoroughness: router.canGoBack() only works if
// there's a screen to go back TO. In the normal flow (tapped in from the
// Settings list) there always is, so this behaves exactly like the automatic
// back button would. A direct link straight to a sub-page (a refreshed
// browser tab, a bookmark) has no history though, so this falls back to
// wherever the button says it goes -- same pattern as PlaceDetails' own Back button.
function goBackOr(fallback: '/profile' | '/settings') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}

function BackButton({ label, fallback }: { label: string; fallback: '/profile' | '/settings' }) {
  return (
    <Pressable
      onPress={() => goBackOr(fallback)}
      hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
    >
      <Text style={{ fontSize: 20, color: colors.link, marginTop: -2 }}>‹</Text>
      <Text style={{ fontSize: 16, color: colors.link }}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Settings', headerLeft: () => <BackButton label="Profile" fallback="/profile" /> }}
      />
      <Stack.Screen
        name="privacy"
        options={{ title: 'Privacy', headerLeft: () => <BackButton label="Settings" fallback="/settings" /> }}
      />
      <Stack.Screen
        name="close-friends"
        options={{ title: 'Close friends', headerLeft: () => <BackButton label="Settings" fallback="/settings" /> }}
      />
      <Stack.Screen
        name="blocked"
        options={{ title: 'Blocked accounts', headerLeft: () => <BackButton label="Settings" fallback="/settings" /> }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: 'Notifications', headerLeft: () => <BackButton label="Settings" fallback="/settings" /> }}
      />
      <Stack.Screen
        name="account"
        options={{ title: 'Account', headerLeft: () => <BackButton label="Settings" fallback="/settings" /> }}
      />
      <Stack.Screen
        name="travel"
        options={{ title: 'Your travel', headerLeft: () => <BackButton label="Settings" fallback="/settings" /> }}
      />
      <Stack.Screen
        name="help"
        options={{ title: 'Help & about', headerLeft: () => <BackButton label="Settings" fallback="/settings" /> }}
      />
    </Stack>
  );
}
