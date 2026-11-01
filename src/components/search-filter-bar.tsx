import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SearchBar } from '@/components/search-bar';

// The search pill with a ▽ button that opens the filters (place type and suited for).
// Shared by Feed, Map and Saved. It holds no data itself: the screen owns the text and the
// chosen filters and passes them in, then re-fetches when they change.

type SearchFilterBarProps = {
  query: string;
  onChangeQuery: (text: string) => void;
  placeTypes: string[]; // the chosen place types
  suitedFor: string[]; // the chosen suited-for tags
  onChangePlaceTypes: (values: string[]) => void;
  onChangeSuitedFor: (values: string[]) => void;
  placeTypeOptions: string[]; // every place type to choose from
  suitedForOptions: string[]; // every suited-for tag to choose from
  right?: ReactNode; // optional extra button after ▽, e.g. the Upload `+`
};

// Adds the value if it's missing, removes it if it's there
function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function SearchFilterBar({
  query,
  onChangeQuery,
  placeTypes,
  suitedFor,
  onChangePlaceTypes,
  onChangeSuitedFor,
  placeTypeOptions,
  suitedForOptions,
  right,
}: SearchFilterBarProps) {
  const [open, setOpen] = useState(false);
  const activeCount = placeTypes.length + suitedFor.length;

  return (
    <View style={styles.bar}>
      <View style={styles.search}>
        <SearchBar value={query} onChangeText={onChangeQuery} placeholder="Search places or cities" />
      </View>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Filters" hitSlop={8}>
        <Text style={styles.filterIcon}>▽{activeCount > 0 ? ` ${activeCount}` : ''}</Text>
      </Pressable>
      {right}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Filters</Text>

          <Text style={styles.sectionTitle}>Place type</Text>
          <View style={styles.chips}>
            {placeTypeOptions.map((option) => (
              <FilterChip
                key={option}
                label={option}
                selected={placeTypes.includes(option)}
                onPress={() => onChangePlaceTypes(toggle(placeTypes, option))}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Suited for</Text>
          <View style={styles.chips}>
            {suitedForOptions.map((option) => (
              <FilterChip
                key={option}
                label={option}
                selected={suitedFor.includes(option)}
                onPress={() => onChangeSuitedFor(toggle(suitedFor, option))}
              />
            ))}
          </View>

          <View style={styles.sheetButtons}>
            <Pressable
              onPress={() => {
                onChangePlaceTypes([]);
                onChangeSuitedFor([]);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Clear</Text>
            </Pressable>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button">
              <Text style={styles.link}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type FilterChipProps = { label: string; selected: boolean; onPress: () => void };

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={selected && styles.chipTextSelected}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  search: {
    flex: 1,
  },
  filterIcon: {
    fontSize: 22,
  },
  sheet: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: '600',
    marginTop: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipTextSelected: {
    color: '#fff',
  },
  sheetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
