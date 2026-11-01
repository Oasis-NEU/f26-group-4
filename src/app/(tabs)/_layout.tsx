import { Tabs } from 'expo-router';
import { Text } from 'react-native';

// The tab bar from the sketch: account, map, feed, saved, search.
// Feed is the middle tab and where the app opens.

function icon(glyph: string) {
  return function TabIcon() {
    return <Text style={{ fontSize: 20 }}>{glyph}</Text>;
  };
}

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="feed" screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('👤') }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: icon('🗺️') }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: icon('🔖') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: icon('🔍') }} />
    </Tabs>
  );
}
