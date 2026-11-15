import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EditPanelSheet } from '@/components/edit-panel-sheet';
import { useAddProfileCity, useCitySearch } from '@/hooks/use-cities';
import type { ProfileCity } from '@/services/profile-cities';

// Reused for both "Lives in" and "Dream trip" -- picked from the city list, not
// typed freely, because there's more than one city with a given name (e.g. more
// than one "Boston"), and the list tells them apart by country. Typing a city
// name that isn't in the list shows a Country field to add it -- the same
// thing that already happens behind the scenes when someone posts a review in
// a city the app doesn't know yet (see addProfileCity).

type EditCityPanelProps = {
  visible: boolean;
  title: string; // "Lives in" or "Dream trip"
  selectedCityId?: string;
  onSelect: (city: ProfileCity) => void; // the whole city, so callers don't look it up again
  onClose: () => void;
};

export function EditCityPanel({ visible, title, selectedCityId, onSelect, onClose }: EditCityPanelProps) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  // Every city when the box is empty; the list is small and cached.
  const results = useCitySearch(query).data ?? [];
  const addCity = useAddProfileCity();

  const trimmedName = query.trim();
  const trimmedCountry = country.trim();
  const canAdd = trimmedName.length > 0 && trimmedCountry.length > 0;

  function selectCity(city: ProfileCity) {
    onSelect(city);
    onClose();
    setQuery('');
    setCountry('');
    addCity.reset();
  }

  function handleAdd() {
    if (!canAdd) return;
    addCity.mutate({ name: trimmedName, country: trimmedCountry }, { onSuccess: selectCity });
  }

  return (
    <EditPanelSheet visible={visible} title={title} onClose={onClose}>
      <TextInput
        style={styles.search}
        placeholder="Search for a city"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          addCity.reset();
        }}
        autoCapitalize="words"
      />

      <FlatList
        data={results}
        keyExtractor={(city) => city.id}
        scrollEnabled={false}
        ListEmptyComponent={
          query ? <Text style={styles.empty}>No cities match &quot;{query}&quot;.</Text> : undefined
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => selectCity(item)}>
            <Text style={styles.cityName}>{item.name}</Text>
            <Text style={styles.cityCountry}>{item.country}</Text>
            {item.id === selectedCityId && <Text style={styles.selectedMark}>✓</Text>}
          </Pressable>
        )}
      />

      {!!query && (
        <View style={styles.addSection}>
          <Text style={styles.addLabel}>Can&apos;t find it? Add &quot;{query}&quot;:</Text>
          <TextInput
            style={styles.countryInput}
            placeholder="Country"
            value={country}
            onChangeText={(text) => {
              setCountry(text);
              addCity.reset();
            }}
            autoCapitalize="words"
          />
          <Pressable
            style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={!canAdd || addCity.isPending}
          >
            <Text style={[styles.addButtonText, !canAdd && styles.addButtonTextDisabled]}>
              {addCity.isPending ? 'Adding…' : `+ Add ${query}${trimmedCountry ? `, ${trimmedCountry}` : ''}`}
            </Text>
          </Pressable>
          {addCity.isError && <Text style={styles.error}>Couldn&apos;t add that city. Try again.</Text>}
        </View>
      )}
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
  addSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  addLabel: {
    fontSize: 13,
    color: '#888',
  },
  countryInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A9D8F',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonDisabled: {
    borderColor: '#ccc',
  },
  addButtonText: {
    color: '#2A9D8F',
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: '#ccc',
  },
  error: {
    color: '#e53e3e',
    fontSize: 13,
    textAlign: 'center',
  },
});
