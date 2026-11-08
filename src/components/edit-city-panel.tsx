import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { EditPanelSheet } from '@/components/edit-panel-sheet';
import { useCitySearch } from '@/hooks/use-cities';
import type { ProfileCity } from '@/services/profile-cities';

// Reused for both "Lives in" and "Dream trip" -- always picked from the city
// list (never typed freely), because there's more than one city with a given
// name. `title` and `selectedCityId` are the only things that differ between
// the two uses.

type EditCityPanelProps = {
  visible: boolean;
  title: string; // "Lives in" or "Dream trip"
  selectedCityId?: string;
  onSelect: (city: ProfileCity) => void; // the whole city, so callers don't look it up again
  onClose: () => void;
};

export function EditCityPanel({ visible, title, selectedCityId, onSelect, onClose }: EditCityPanelProps) {
  const [query, setQuery] = useState('');
  // Every city when the box is empty; the list is small and cached.
  const results = useCitySearch(query).data ?? [];

  return (
    <EditPanelSheet visible={visible} title={title} onClose={onClose}>
      <TextInput
        style={styles.search}
        placeholder="Search for a city"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="words"
      />

      <FlatList
        data={results}
        keyExtractor={(city) => city.id}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>No cities match &quot;{query}&quot;.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => {
              onSelect(item);
              onClose();
            }}
          >
            <Text style={styles.cityName}>{item.name}</Text>
            <Text style={styles.cityCountry}>{item.country}</Text>
            {item.id === selectedCityId && <Text style={styles.selectedMark}>✓</Text>}
          </Pressable>
        )}
      />
    </EditPanelSheet>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
  },
  cityCountry: {
    flex: 1,
    fontSize: 13,
    color: '#888',
  },
  selectedMark: {
    color: '#2A9D8F',
    fontWeight: '700',
  },
  empty: {
    color: 'gray',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
