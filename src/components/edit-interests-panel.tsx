import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EditPanelSheet } from '@/components/edit-panel-sheet';
import {
  addInterest,
  getInterestsByIds,
  getPopularInterests,
  searchInterests,
  suggestInterestsFromPosts,
} from '@/services/interests';
import type { Interest } from '@/types/interest';

const MAX_INTERESTS = 6;
// An interest only counts as "popular" once ~5 people have picked it; below
// that, it's still shown (e.g. your own new one), just marked NEW.
const POPULAR_THRESHOLD = 5;

type EditInterestsPanelProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function EditInterestsPanel({ visible, onClose, userId, selectedIds, onChange }: EditInterestsPanelProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Interest[]>([]);
  const [popular, setPopular] = useState<Interest[]>([]);
  const [suggested, setSuggested] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    getPopularInterests(20).then(setPopular);
    suggestInterestsFromPosts().then(setSuggested);
  }, [visible]);

  useEffect(() => {
    getInterestsByIds(selectedIds).then(setSelectedInterests);
  }, [selectedIds]);

  useEffect(() => {
    if (!visible) return;
    let ignore = false;
    searchInterests(query).then((results) => {
      if (!ignore) setSearchResults(results);
    });
    return () => {
      ignore = true;
    };
  }, [query, visible]);

  function toggle(interest: Interest) {
    setError('');
    const isSelected = selectedIds.includes(interest.id);
    if (isSelected) {
      onChange(selectedIds.filter((id) => id !== interest.id));
      return;
    }
    if (selectedIds.length >= MAX_INTERESTS) {
      setError('You can pick up to 6. Remove one first.');
      return;
    }
    onChange([...selectedIds, interest.id]);
  }

  async function handleAddNew() {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed.length > 24 || trimmed.split(/\s+/).length > 3) {
      setError('Interests can be up to 3 words');
      return;
    }
    if (selectedIds.length >= MAX_INTERESTS) {
      setError('You can pick up to 6. Remove one first.');
      return;
    }
    const created = await addInterest(trimmed);
    onChange([...selectedIds, created.id]);
    setQuery('');
  }

  const hasExactMatch = searchResults.some((interest) => interest.slug === slugify(query));
  const showAddButton = query.trim().length > 0 && !hasExactMatch;

  function renderChip(interest: Interest, isNew: boolean) {
    const isSelected = selectedIds.includes(interest.id);
    return (
      <Pressable
        key={interest.id}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => toggle(interest)}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{interest.name}</Text>
        {isNew && <Text style={styles.newBadge}>NEW</Text>}
        {interest.isStarter === false && interest.userCount >= POPULAR_THRESHOLD && (
          <Text style={styles.countText}>{interest.userCount >= 1000 ? `${Math.round(interest.userCount / 100) / 10}k` : interest.userCount}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <EditPanelSheet visible={visible} title="Interests" onClose={onClose}>
      <Text style={styles.counter}>
        {selectedIds.length} of {MAX_INTERESTS} picked
      </Text>

      {selectedInterests.length > 0 && (
        <View style={styles.chipRow}>{selectedInterests.map((interest) => renderChip(interest, false))}</View>
      )}

      <TextInput
        style={styles.search}
        placeholder="Find or add an interest"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setError('');
        }}
      />
      <Text style={styles.searchCounter}>{query.length}/24</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {query.length > 0 && (
        <View style={styles.chipRow}>
          {searchResults.filter((interest) => !selectedIds.includes(interest.id)).map((interest) => renderChip(interest, interest.createdBy === userId))}
          {showAddButton && (
            <Pressable style={styles.addButton} onPress={handleAddNew}>
              <Text style={styles.addButtonText}>+ Add &quot;{query.trim()}&quot;</Text>
            </Pressable>
          )}
        </View>
      )}

      {suggested.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>From your posts</Text>
          <View style={styles.chipRow}>
            {suggested.filter((interest) => !selectedIds.includes(interest.id)).map((interest) => renderChip(interest, false))}
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>Popular on the app</Text>
      <View style={styles.chipRow}>
        {popular.filter((interest) => !selectedIds.includes(interest.id)).map((interest) => renderChip(interest, false))}
      </View>
    </EditPanelSheet>
  );
}

const styles = StyleSheet.create({
  counter: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  chipSelected: {
    backgroundColor: '#2A9D8F',
  },
  chipText: {
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  newBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#e67700',
  },
  countText: {
    fontSize: 11,
    color: '#888',
  },
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchCounter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    marginBottom: 8,
  },
  error: {
    color: '#e53e3e',
    fontSize: 13,
    marginBottom: 8,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A9D8F',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 13,
    color: '#2A9D8F',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 4,
    marginBottom: 8,
  },
});
