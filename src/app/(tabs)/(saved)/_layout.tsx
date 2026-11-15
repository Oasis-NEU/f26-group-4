import { Stack } from 'expo-router';

// The saved tab's own stack.
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
// of their stacks, so a place opened from the Feed stays in the Feed and the
// same place opened from Saved stays in Saved. One file, not five copies.
export default function SavedStackLayout() {
  return (
    <Stack>
      {/* Only the tab's own screen is listed. Everything else pushed on top
          of it gets the standard header with a back arrow. */}
      <Stack.Screen name="saved" options={{ title: 'Saved', headerShown: true }} />
    </Stack>
  );
}
