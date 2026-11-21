import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { CollectionPickerSheet } from '@/components/collection-picker-sheet';
import { Icon } from '@/components/ui';
import type { SavedTo } from '@/services/collections';
import { colors, radius, spacing, type } from '@/theme';

// The little bar that slides up after you save a place, and the collection
// picker it opens.
//
// WHY IT LIVES HERE AND NOT IN A SCREEN
//
// You can save a place from the feed, from Place details, from a collection.
// The bar has to sit above the tab bar in all of them and survive the screen
// changing underneath it, so it's mounted once in the tabs layout and screens
// ask for it through this context. A bar inside a screen would slide away
// with the screen.
//
// WHAT IT SAYS
//
// Two cases, and the difference is the whole point of the feature:
//
//   Nothing caught it   "Saved. Add to a collection?"
//                       The place is saved but uncategorised, so this is a
//                       real question worth asking.
//
//   Auto add caught it  "Added to France. Change?"
//                       "Added to France and Europe. Change?"
//                       "Added to France and 2 others. Change?"
//                       Nothing to do here -- it's already sorted -- so this
//                       is telling you where it went, and offering a way to
//                       disagree. Several collections can catch one place.
//
// Either way it goes away on its own. Ignoring it is the normal thing to do.

const VISIBLE_FOR = 5000; // ms before it slides away on its own
const SLIDE_MS = 220;

type SavePromptValue = {
  // Called after a save. `savedTo` is the collections auto add put it in --
  // an empty list means nothing caught it.
  showSavePrompt: (place: { id: string; name: string }, savedTo: SavedTo[]) => void;
};

const SavePromptContext = createContext<SavePromptValue | null>(null);

// Screens call this to show the bar. It does nothing outside the provider, so
// a screen that lives outside the tabs can still call it without crashing.
export function useSavePrompt(): SavePromptValue {
  const value = useContext(SavePromptContext);
  return value ?? { showSavePrompt: () => {} };
}

// "France", "France and Europe", "France and 2 others".
function describeWhere(savedTo: SavedTo[]): string {
  if (savedTo.length === 1) {
    return savedTo[0].name;
  }

  if (savedTo.length === 2) {
    return `${savedTo[0].name} and ${savedTo[1].name}`;
  }

  return `${savedTo[0].name} and ${savedTo.length - 1} others`;
}

type Prompt = {
  place: { id: string; name: string };
  savedTo: SavedTo[];
};

export function SavePromptProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Slides up from under the tab bar and back down again.
  //
  // useState, not useRef: the value is read while rendering (it's in the
  // style), and the React Compiler won't allow a ref to be read there. The
  // function form makes the Animated.Value once rather than on every render.
  const [slide] = useState(() => new Animated.Value(0));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (hideTimer.current !== null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    Animated.timing(slide, { toValue: 0, duration: SLIDE_MS, useNativeDriver: true }).start(() => {
      setPrompt(null);
    });
  }, [slide]);

  const showSavePrompt = useCallback<SavePromptValue['showSavePrompt']>(
    (place, savedTo) => {
      // A second save replaces the first rather than stacking: saving five
      // places quickly should leave one bar, about the last one.
      if (hideTimer.current !== null) {
        clearTimeout(hideTimer.current);
      }

      setPrompt({ place, savedTo });
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: SLIDE_MS, useNativeDriver: true }).start();

      hideTimer.current = setTimeout(hide, VISIBLE_FOR);
    },
    [hide, slide],
  );

  // Don't leave a timer running if the app moves on.
  useEffect(() => {
    return () => {
      if (hideTimer.current !== null) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ showSavePrompt }), [showSavePrompt]);

  function openPicker() {
    // Stop the countdown: the bar's job is done once the sheet is open.
    if (hideTimer.current !== null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setSheetOpen(true);
  }

  function closePicker() {
    setSheetOpen(false);
    hide();
  }

  const wasAutoAdded = prompt !== null && prompt.savedTo.length > 0;

  return (
    <SavePromptContext.Provider value={value}>
      {children}

      {prompt !== null && (
        <Animated.View
          style={[
            styles.bar,
            {
              opacity: slide,
              transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
            },
          ]}
          // Lets taps through to the screen everywhere except the bar itself.
          pointerEvents="box-none"
        >
          <Pressable style={styles.inner} onPress={openPicker} accessibilityRole="button">
            <View style={styles.text}>
              <Text style={styles.message} numberOfLines={2}>
                {wasAutoAdded ? `Added to ${describeWhere(prompt.savedTo)}.` : 'Saved.'}{' '}
                <Text style={styles.action}>{wasAutoAdded ? 'Change?' : 'Add to a collection?'}</Text>
              </Text>
            </View>

            <Pressable
              onPress={hide}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              hitSlop={10}
              style={styles.dismiss}
            >
              <Icon name="close" size={16} color={colors.textOnDark} />
            </Pressable>
          </Pressable>
        </Animated.View>
      )}

      {prompt !== null && (
        <CollectionPickerSheet
          visible={sheetOpen}
          placeId={prompt.place.id}
          placeName={prompt.place.name}
          onClose={closePicker}
        />
      )}
    </SavePromptContext.Provider>
  );
}

const styles = StyleSheet.create({
  // Sits above the tab bar rather than over it, so the tabs stay usable while
  // the bar is up.
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radius.round,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
  },
  text: {
    flex: 1,
  },
  message: {
    fontSize: type.body,
    lineHeight: 20,
    color: colors.textOnDark,
  },
  // The tappable half of the sentence, so it reads as a question you can
  // answer rather than a notice.
  action: {
    fontWeight: '700',
    color: colors.butter,
  },
  dismiss: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
