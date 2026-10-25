import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

// The tab bar at the bottom of the screen. Each Tabs.Screen is one tab, and its `name`
// is the file in this folder that it opens, e.g. name="search" opens search.tsx.
//
// To add a tab: create a file in this folder, then add a Tabs.Screen for it below.
// Icon names: `ios` is an SF Symbol (https://developer.apple.com/sf-symbols/),
// `android` and `web` are Material Symbols (https://fonts.google.com/icons).
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'map.fill', android: 'map', web: 'map' }} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
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
