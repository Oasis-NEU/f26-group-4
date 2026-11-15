import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SavedPlaceRow } from '@/components/saved-place-row';
import { Icon } from '@/components/ui';
import { canAddSubCollection, getCollection } from '@/services/collections';
import { Collection } from '@/types/collection';
import { colors, spacing, type } from '@/theme';

// Inside one collection, e.g. /collection/col_europe.
// Shows the collection's own places, and its sub-collections as labelled groups.

export default function CollectionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [canAddSub, setCanAddSub] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reload every time this screen comes back into view, so a place un-saved on
  // the Place page -- or a sub-collection just made -- shows up straight away.
  useFocusEffect(
    useCallback(() => {
      getCollection(id).then((result) => {
        setCollection(result);
        setIsLoading(false);
      });

      canAddSubCollection(id).then((allowed) => setCanAddSub(allowed));
    }, [id]),
  );

  function openPlace(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } });
  }

  // The + in the header. It passes this collection's id, so the New collection
  // screen knows the new one goes inside this one -- that's the only way to
  // make a sub-collection, which is why there's no "Inside" picker over there.
  function openNewSubCollection() {
    router.push({ pathname: '/new-collection', params: { parentId: id } });
  }

  // Getting out of here.
  //
  // The header's back arrow is drawn by the navigator, and it only appears
  // when there's a screen to go back TO. Open a collection from a link, or
  // reload the page on one, and there isn't -- so no arrow at all.
  //
  // So this screen always draws its own, and decides where it goes: back if
  // there's anywhere to go back to, and the Saved tab if there isn't.
  // router.canGoBack() isn't enough on its own to decide whether to SHOW one
  // -- on a cold load it answers true even though the navigator draws
  // nothing, which is how the screen ended up with no way off it.
  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/saved');
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (collection === null) {
    return (
      <View style={styles.centered}>
        <Text>This collection no longer exists.</Text>
      </View>
    );
  }

  // Sub-collections are only shown one level deep, even though the type allows
  // deeper nesting. Limiting the depth is a rule, so it belongs in the code that
  // creates collections, not in the type.
  const subCollections = collection.subCollections ?? [];

  const isEmpty = collection.places.length === 0 && subCollections.length === 0;

  return (
    // On iOS the header is see-through, so this keeps the content from starting underneath it.
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.page}
      contentContainerStyle={styles.pageContent}
    >
      {/* Puts the collection's name in the bar at the top of the screen,
          instead of the route name. */}
      <Stack.Screen
        options={{
          title: collection.name,
          headerLeft: () => (
            <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
              <Icon name="back" size={24} />
            </Pressable>
          ),
          // The + only shows while this collection is allowed to hold another
          // one inside it -- three levels deep is the limit.
          headerRight: () =>
            canAddSub ? (
              <Pressable
                onPress={openNewSubCollection}
                accessibilityRole="button"
                accessibilityLabel="New sub-collection"
                hitSlop={8}
              >
                <Icon name="add" size={22} />
              </Pressable>
            ) : null,
        }}
      />

      {isEmpty && (
        <Text style={styles.emptyText}>
          No places in this collection yet.
          {canAddSub ? ' Tap + to make a sub-collection, like France inside Europe.' : ''}
        </Text>
      )}

      {/* Each sub-collection gets a heading and its own list of rows */}
      {subCollections.map((sub) => (
        <View key={sub.id} style={styles.group}>
          {/* Tapping the heading opens that sub-collection on its own screen.
              It has to be tappable: a sub-collection can have its OWN
              sub-collections (Europe > France > Paris), and those can't be
              shown here without the page turning into a tree. */}
          <Pressable
            onPress={() => router.push({ pathname: '/collection/[id]', params: { id: sub.id } })}
            accessibilityRole="button"
            style={styles.groupHeadingRow}
          >
            <Text style={styles.groupHeading}>{sub.name}</Text>
            <Icon name="forward" size={18} color={colors.textMuted} />
          </Pressable>

          {sub.places.map((place) => (
            <SavedPlaceRow
              key={place.id}
              place={place}
              onPress={() => openPlace(place.id)}
              onRemove={() => {
                // TODO: actually remove the place once collections can be edited.
                // The plan is to show a short "Removed. Undo" message rather than
                // asking "are you sure?" first.
              }}
            />
          ))}
        </View>
      ))}

      {/* Places saved straight into this collection, not into a sub-collection */}
      {collection.places.map((place) => (
        <SavedPlaceRow
          key={place.id}
          place={place}
          onPress={() => openPlace(place.id)}
          onRemove={() => {
            // TODO: same as above.
          }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    gap: spacing.md,
  },
  // Heading on the left, chevron on the right, so it reads as a link.
  groupHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupHeading: {
    fontWeight: 'bold',
    fontSize: type.heading,
    letterSpacing: -0.5,
    paddingTop: spacing.sm,
    color: colors.text,
  },
  emptyText: {
    fontSize: type.body,
    color: colors.textMuted,
  },
});
