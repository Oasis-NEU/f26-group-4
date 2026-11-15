import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SavedPlaceRow } from '@/components/saved-place-row';
import { Icon } from '@/components/ui';
import {
  ALL_SAVED_ID,
  useCanAddSubCollection,
  useCollection,
  useRemoveFromCollection,
} from '@/hooks/use-collections';
import { useToggleSave } from '@/hooks/use-saves';
import { colors, spacing, type } from '@/theme';

// Inside one collection, e.g. /collection/<id>.
// Shows the collection's own places, and its sub-collections as labelled groups.

export default function CollectionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // From the shared cache: un-saving a place anywhere, or making a
  // sub-collection, refreshes this page too.
  const { data: collection, isPending: isLoading, isError } = useCollection(id);
  const canAddSub = useCanAddSubCollection(id);
  const removeFromCollection = useRemoveFromCollection();
  const toggleSave = useToggleSave();

  // Taking a place out of a collection leaves it saved. "All saved" isn't a
  // real collection, so removing from it un-saves the place.
  // TODO: show a short "Removed. Undo" message, as the plan describes.
  function removePlace(collectionId: string, placeId: string) {
    if (collectionId === ALL_SAVED_ID) {
      toggleSave.mutate({ placeId, save: false });
    } else {
      removeFromCollection.mutate({ collectionId, placeId });
    }
  }

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

  // The back arrow, drawn on every state of the page so there's always a way out.
  const backButton = () => (
    <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
      <Icon name="back" size={24} />
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '', headerLeft: backButton }} />
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !collection) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '', headerLeft: backButton }} />
        <Text>{isError ? "Couldn't load this collection." : 'This collection no longer exists.'}</Text>
      </View>
    );
  }

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
          headerLeft: backButton,
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
              onRemove={() => removePlace(sub.id, place.id)}
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
          onRemove={() => removePlace(collection.id, place.id)}
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
