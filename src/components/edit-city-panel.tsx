import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { EditPanelSheet } from '@/components/edit-panel-sheet';
import { useAddProfileCity, useCitySearch } from '@/hooks/use-cities';
import type { ProfileCity } from '@/services/profile-cities';

// Reused for both "Lives in" and "Dream trip" -- picked from the city list, not
// typed freely, because there's more than one city with a given name (e.g. more
// than one "Boston"), and the list tells them apart by country. When a search
// comes up empty, typing "City, Country" offers to add it -- the same thing
// that already happens behind the scenes when someone posts a review in a
// city the app doesn't know yet (see addProfileCity).

type EditCityPanelProps = {
  visible: boolean;
  title: string; // "Lives in" or "Dream trip"
  selectedCityId?: string;
  onSelect: (city: ProfileCity) => void; // the whole city, so callers don't look it up again
  onClose: () => void;
};

// Splits "Springfield, Canada" into its two parts, or null if there's no comma
// yet, or either side is empty once trimmed.
function parseNameAndCountry(query: string): { name: string; country: string } | null {
  const commaIndex = query.indexOf(',');
  if (commaIndex === -1) return null;
  const name = query.slice(0, commaIndex).trim();
  const country = query.slice(commaIndex + 1).trim();
  if (!name || !country) return null;
  return { name, country };
}

export function EditCityPanel({ visible, title, selectedCityId, onSelect, onClose }: EditCityPanelProps) {
  const [query, setQuery] = useState('');
  // Every city when the box is empty; the list is small and cached.
  const results = useCitySearch(query).data ?? [];
  const addCity = useAddProfileCity();

  const parsed = parseNameAndCountry(query);
  const hasExactMatch = results.some(
    (city) => parsed && city.name.toLowerCase() === parsed.name.toLowerCase() && city.country.toLowerCase() === parsed.country.toLowerCase(),
  );
  const canAdd = parsed !== null && !hasExactMatch;

  function selectCity(city: ProfileCity) {
    onSelect(city);
    onClose();
    setQuery('');
    addCity.reset();
  }

  function handleAdd() {
    if (!parsed) return;
    addCity.mutate(parsed, { onSuccess: selectCity });
  }

  return (
    <EditPanelSheet visible={visible} title={title} onClose={onClose}>
      <TextInput
        style={styles.search}
        placeholder="Search, or type City, Country to add one"
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
          <Text style={styles.empty}>
            {query
              ? parsed
                ? 'No match -- add it below.'
                : `No cities match "${query}". Add "${query}, Country" to add a new one.`
              : 'No cities yet.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => selectCity(item)}>
            <Text style={styles.cityName}>{item.name}</Text>
            <Text style={styles.cityCountry}>{item.country}</Text>
            {item.id === selectedCityId && <Text style={styles.selectedMark}>✓</Text>}
          </Pressable>
        )}
      />

      {canAdd && (
        <Pressable style={styles.addRow} onPress={handleAdd} disabled={addCity.isPending}>
          <Text style={styles.addText}>
            {addCity.isPending ? 'Adding…' : `+ Add "${parsed!.name}, ${parsed!.country}"`}
          </Text>
        </Pressable>
      )}
      {addCity.isError && <Text style={styles.error}>Couldn&apos;t add that city. Try again.</Text>}
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
  addRow: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A9D8F',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addText: {
    color: '#2A9D8F',
    fontWeight: '600',
  },
  error: {
    marginTop: 8,
    color: '#e53e3e',
    fontSize: 13,
    textAlign: 'center',
  },
});
