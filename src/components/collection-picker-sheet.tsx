import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CollectionTile, Icon } from '@/components/ui';
import { useCollections } from '@/hooks/use-collections';
import { useAddToCollection } from '@/hooks/use-saves';
import { everyPlaceIn, flattenCollections } from '@/lib/collection-tree';
import { colors, radius, spacing, type } from '@/theme';

// "Add to a collection": the sheet that slides up when you tap the message
// after saving a place.
//
// It's the Pinterest idea -- a list of everywhere this could go, one tap to
// put it there -- drawn with our own pieces: CollectionTile in its `compact`
// size, so a list of eight collections is a list and not a wall of tall
// cards.
//
// Sub-collections are in the list too, indented, because "Paris" is usually
// where you want a place rather than "Europe Trip". The list is flat rather
// than a tree: you're picking one thing, not browsing.

type CollectionPickerSheetProps = {
  visible: boolean;
  placeId: string;
  placeName: string;
  onClose: () => void;
};

export function CollectionPickerSheet({ visible, placeId, placeName, onClose }: CollectionPickerSheetProps) {
  const { data: collections, isPending } = useCollections();
  const addToCollection = useAddToCollection();

  // Flattened, so a sub-collection is a row of its own with its depth kept
  // for the indent.
  const rows = flattenCollections(collections ?? []);

  function choose(collectionId: string) {
    addToCollection.mutate({ collectionId, placeId });
    onClose();
  }

  function makeNewCollection() {
    onClose();
    router.push('/new-collection');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* Tapping the dimmed area behind the sheet closes it, the way a sheet
          is expected to behave. */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />

      <View style={styles.sheet}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Add to a collection</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {placeName}
            </Text>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Icon name="close" size={22} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {isPending && <Text style={styles.message}>Loading your collections…</Text>}

          {!isPending && rows.length === 0 && (
            <Text style={styles.message}>
              You haven&apos;t made a collection yet. Make one and this place goes straight into it.
            </Text>
          )}

          {rows.map(({ collection, depth }, index) => {
            const places = everyPlaceIn(collection);
            const alreadyIn = places.some((place) => place.id === placeId);
            const count = places.length;

            return (
              <View key={collection.id} style={[styles.row, depth > 1 && { paddingLeft: spacing.lg * (depth - 1) }]}>
                <View style={styles.tile}>
                  <CollectionTile
                    name={collection.name}
                    details={
                      alreadyIn
                        ? 'Already in here'
                        : `${count} ${count === 1 ? 'place' : 'places'}`
                    }
                    index={index}
                    image={collection.coverImage}
                    compact
                    // A place can be in several collections, so one it's
                    // already in isn't disabled -- it just says so.
                    onPress={() => (alreadyIn ? onClose() : choose(collection.id))}
                  />
                </View>
              </View>
            );
          })}

          {/* Last, the way "Create board" sits at the bottom on Pinterest. */}
          <Pressable
            onPress={makeNewCollection}
            accessibilityRole="button"
            style={styles.newRow}
          >
            <Icon name="add" size={20} color={colors.secondaryText} />
            <Text style={styles.newRowText}>New collection</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrimNeutral,
  },
  // Two thirds of the screen, so what's underneath still shows and the sheet
  // reads as sitting on top rather than being a new page.
  sheet: {
    height: '66%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.collection,
    borderTopRightRadius: radius.collection,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.round,
    backgroundColor: colors.line,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: type.title,
    letterSpacing: -0.6,
    color: colors.text,
  },
  subtitle: {
    fontSize: type.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
  },
  message: {
    fontSize: type.body,
    lineHeight: 21,
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    backgroundColor: colors.secondaryFill,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  newRowText: {
    fontWeight: '600',
    fontSize: type.body,
    color: colors.secondaryText,
  },
});
