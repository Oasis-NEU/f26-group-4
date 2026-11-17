import { Stack } from 'expo-router';

// The explore tab's own stack.
//
// Every tab has one of these. It's what lets opening a place or a collection
// PUSH a screen inside the tab: the bottom tab bar stays on screen and the
// header gets a back arrow. Before this, those screens sat in the root stack
// ABOVE the tabs, so going into a collection hid the tab bar completely, and
// if you'd arrived by link or by reloading the page there was no way back out.
//
// The detail screens aren't in here -- they're in the
// (profile,map,explore,saved) folder next door. That one folder name
// lists every tab, and Expo Router puts a copy of what's inside it into each
// of their stacks, so a place opened from Explore stays in Explore and the
// same place opened from Saved stays in Saved. One file, not four copies.
export default function ExploreStackLayout() {
  return (
    <Stack>
      {/* The tab's own screen first. Anything pushed on top that isn't listed
          here gets the standard header with a back arrow. */}
      {/* index.tsx, so Explore is the app's home screen at "/". It draws
          its own search bar and heading, so no header here. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Screens from the shared (profile,map,explore,saved) folder that need
          something other than the standard header. Place shows "Place" while
          it loads (PlaceDetails then draws its own back button), and someone's
          profile draws its own top bar. */}
      <Stack.Screen name="place/[id]" options={{ title: 'Place' }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
