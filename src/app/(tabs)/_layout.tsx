import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

// The tab bar at the bottom of the screen. Each Tabs.Screen is one tab, and its `name`
// is the file in this folder that it opens, e.g. name="explore" opens explore.tsx.
// The order matches the sketch: account, map, feed, saved, explore. Feed is index.tsx, so
// `/` still opens it even though it's the middle tab.
//
// To add a tab: create a file in this folder, then add a Tabs.Screen for it below.
// Icon names: `ios` is an SF Symbol (https://developer.apple.com/sf-symbols/),
// `android` and `web` are Material Symbols (https://fonts.google.com/icons).
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // Profile draws its own top bar, so it doesn't need a header too
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          // The map draws its own search bar at the top instead of a header
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'map.fill', android: 'map', web: 'map' }} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          // The feed draws its own search bar at the top instead of a header
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          // Saved draws its own "Saved" heading, so it doesn't need a header too
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' }} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          // Explore draws its own "Explore" heading, so it doesn't need a header too
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' }}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
