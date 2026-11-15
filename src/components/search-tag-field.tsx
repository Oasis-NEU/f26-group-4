import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

// A "type to find it" picker, for lists too long to show as a row of pills.
//
// TagPicker shows every choice at once, which is right for five options and
// wrong for two hundred countries or a tag list that keeps growing. This one
// shows a search box instead: type, pick from the results, and what you picked
// sits above the box as chips you can take off again.
//
//   <SearchTagField
//     label="Country"
//     placeholder="Search countries"
//     selected={countries}
//     onChange={setCountries}
//     search={(text) => Promise.resolve(searchCountries(text).map((c) => c.name))}
//   />
//
// `allowNew` adds an "Add ..." row when what you typed isn't in the list, for
// the places where the list is meant to grow (tags, cities).

type SearchTagFieldProps = {
  label: string;
  placeholder: string;

  // What's picked, and how to give the new list back.
  selected: string[];
  onChange: (selected: string[]) => void;

  // Finds the choices for what's been typed so far. Async because most of
  // these come from a service.
  search: (query: string) => Promise<string[]>;

  // Lets the user add something that isn't in the results yet.
  allowNew?: boolean;

  // Only one choice at a time, e.g. a place's type.
  multiple?: boolean;

  // Small note under the label.
  hint?: string;

  disabled?: boolean;
};

// How many results to show at once. Any more and the list takes over the page.
const MAX_RESULTS = 6;

export function SearchTagField({
  label,
  placeholder,
  selected,
  onChange,
  search,
  allowNew = false,
  multiple = true,
  hint,
  disabled = false,
}: SearchTagFieldProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Closing the results when you tap away is fiddlier than it sounds. Tapping
  // a result makes the box lose focus FIRST, so closing straight away on blur
  // would hide the row before the tap landed on it and nothing would get
  // picked. So blur waits a moment, and picking something cancels the wait.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function closeSoon() {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setIsOpen(false);
      // Clear what was typed too. Half-typed text left behind in a closed box
      // reads like something went wrong, and nothing is lost -- the text only
      // ever filtered the list.
      setQuery('');
    }, 150);
  }

  // Don't leave a timer running if the screen closes mid-tap.
  useEffect(() => {
    return () => cancelClose();
  }, []);

  // Look up the results whenever what's typed changes. `ignore` stops an old,
  // slow answer landing after a newer one and overwriting it.
  useEffect(() => {
    let ignore = false;

    search(query).then((found) => {
      if (!ignore) {
        setResults(found);
      }
    });

    return () => {
      ignore = true;
    };
  }, [query, search]);

  function add(value: string) {
    if (multiple) {
      if (!selected.includes(value)) {
        onChange([...selected, value]);
      }
    } else {
      onChange([value]);
    }

    // Clear the box so the next one can be typed straight away.
    cancelClose();
    setQuery('');
    setIsOpen(false);
  }

  function remove(value: string) {
    onChange(selected.filter((item) => item !== value));
  }

  // Results minus what's already picked, cut down to a sensible number.
  const notPickedYet: string[] = [];

  for (const result of results) {
    if (!selected.includes(result) && notPickedYet.length < MAX_RESULTS) {
      notPickedYet.push(result);
    }
  }

  // Is what they typed already a choice? If not, and the list is allowed to
  // grow, offer to add it.
  const typed = query.trim();
  let exactMatch = false;

  for (const result of results) {
    if (result.toLowerCase() === typed.toLowerCase()) {
      exactMatch = true;
    }
  }

  const canAddNew = allowNew && typed !== '' && !exactMatch && !selected.includes(typed);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {hint !== undefined && <Text style={styles.hint}>{hint}</Text>}

      {/* What's been picked. Tap the x to take one off. */}
      {selected.length > 0 && (
        <View style={styles.chipRow}>
          {selected.map((value) => (
            <Pressable
              key={value}
              onPress={() => remove(value)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={'Remove ' + value}
              style={styles.chip}
            >
              <Text style={styles.chipText}>{value}</Text>
              <Icon name="close" size={14} color={colors.textOnDark} />
            </Pressable>
          ))}
        </View>
      )}

      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        onFocus={() => {
          cancelClose();
          setIsOpen(true);
        }}
        onBlur={closeSoon}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        editable={!disabled}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {/* The results only show once the box has been tapped, so five of these
          on one screen don't all have a list open underneath them. */}
      {isOpen && (notPickedYet.length > 0 || canAddNew) && (
        <View style={styles.results}>
          {notPickedYet.map((result) => (
            <Pressable
              key={result}
              onPressIn={cancelClose}
              onPress={() => add(result)}
              disabled={disabled}
              accessibilityRole="button"
              style={styles.resultRow}
            >
              <Text style={styles.resultText}>{result}</Text>
            </Pressable>
          ))}

          {canAddNew && (
            <Pressable
              onPressIn={cancelClose}
              onPress={() => add(typed)}
              disabled={disabled}
              accessibilityRole="button"
              style={styles.resultRow}
            >
              <Text style={styles.addNewText}>Add &ldquo;{typed}&rdquo;</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  label: {
    fontWeight: 'bold',
    fontSize: type.body,
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  hint: {
    fontSize: type.small,
    lineHeight: 17,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  // A picked tag: black pill, white text, with an x on the end.
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 36,
    backgroundColor: colors.ink,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: {
    fontWeight: '600',
    fontSize: type.label,
    color: colors.textOnDark,
  },
  input: {
    backgroundColor: colors.fill,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: type.body,
    color: colors.text,
  },
  results: {
    backgroundColor: colors.fill,
    borderRadius: radius.card,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  resultRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  resultText: {
    fontSize: type.body,
    color: colors.text,
  },
  addNewText: {
    fontWeight: '600',
    fontSize: type.body,
    color: colors.periwinkleText,
  },
});
