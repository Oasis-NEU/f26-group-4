import { Redirect, router, Tabs, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { useSession } from '@/hooks/use-session';

// The tab bar at the bottom of the screen. Each Tabs.Screen is one tab, and its `name`
// is the FOLDER in this folder that it opens, e.g. name="(explore)" opens
// (explore)/_layout.tsx, which is that tab's own stack.
// The center New post action opens the root upload modal.
//
// There used to be a Feed tab AND an Explore tab. Explore was a page of city
// tiles, and tapping one opened a third screen listing that city's places --
// the same places the feed already showed. They're one tab now: the tiles are
// a row at the top of the feed and they filter it in place. Explore is
// index.tsx, so it's what `/` opens.
//
// Each tab is a folder in brackets rather than a single file, because each one
// has its own stack inside it -- see any of the (name)/_layout.tsx files for
// why. The brackets mean "group": they organise the files without showing up
// in the address, so the Saved tab is still /saved and not /(saved)/saved.
//
// To add a tab: make a (name) folder with a _layout.tsx and a screen in it,
// add the name to the (profile,map,explore,saved) folder so the shared screens
// are in its stack too, then add a Tabs.Screen for it below.
// Icon names: `ios` is an SF Symbol (https://developer.apple.com/sf-symbols/),
// `android` and `web` are Material Symbols (https://fonts.google.com/icons).
export default function TabsLayout() {
  const { user } = useSession();
  const pathname = usePathname();
  const isPreview = !user;

  if (isPreview && pathname !== '/' && pathname !== '/new-post' && pathname !== '/upload') {
    return <Redirect href="/" />;
  }

  return (
    // Headers are drawn by each tab's own stack now, so the tab navigator
    // doesn't draw one as well -- two headers would stack up.
    <Tabs
      screenOptions={{ headerShown: false }}
      screenListeners={({ route }) => ({
        tabPress: (event) => {
          if (isPreview && route.name !== '(explore)' && route.name !== 'new-post') {
            event.preventDefault();
          }
        },
      })}
    >
      <Tabs.Screen
        name="(explore)"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' }}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(saved)"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' }} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-post"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.push('/upload');
          },
        }}
        options={{
          title: 'New post',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }} size={28} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(map)"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'map.fill', android: 'map', web: 'map' }} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor={color} />
          ),
        }}
      />
    </Tabs>
  );
}
