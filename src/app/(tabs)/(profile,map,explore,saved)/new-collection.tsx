import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { SearchTagField } from '@/components/search-tag-field';
import { TagPicker } from '@/components/tag-picker';
import { Button, Icon } from '@/components/ui';
import { useCitySearch } from '@/hooks/use-cities';
import { useCreateCollection, useRulesAbove } from '@/hooks/use-collections';
import { useFilterOptions } from '@/hooks/use-places';
import { useTags } from '@/hooks/use-tags';
import { useAllSavedPlaces } from '@/hooks/use-saves';
import { useSettings } from '@/hooks/use-settings';
import { describeRules, isEmptyRules } from '@/lib/collection-rules';
import { describeLimits, matchesWithAncestors } from '@/lib/collection-tree';
import { COUNTRY_NAMES } from '@/lib/countries';
import { REGION_NAMES } from '@/lib/regions';
import { colors, radius, spacing, type } from '@/theme';
import { CollectionRules } from '@/types/collection';

// Making a collection.
//
// Opened two ways:
//   - the + on the Saved tab, for a collection of its own
//   - the + inside a collection, which passes ?parentId=... to make a
//     sub-collection of that one (Europe Trip > France > Paris)
//
// There's no "Inside" picker here on purpose. Where a collection sits is
// decided by WHERE YOU TAPPED +, the way Pinterest sections work -- a picker
// listing every collection is a lot of screen for something most people only
// want at the top level.
//
// A sub-collection does NOT start with its parent's rules filled in. It's
// narrowed by them instead: inside "France", only French places can land here
// whatever you pick, so "Paris" means Paris and not "France or Paris". The
// line under the heading says so.
//
// The top of the screen is deliberately short: a name, and whether it's
// private. Everything about auto add is folded away behind one row, so making
// a plain collection is two taps and the clever part is there if you want it.

// The big regions are written first in src/lib/regions.ts. Only those show to
// start with; the smaller ones (Scandinavia, Southeast Asia...) are behind
// "Show all regions" so the picker isn't a wall of pills.
const BROAD_REGIONS = REGION_NAMES.slice(0, 7);

export default function NewCollectionPage() {
  // Set when the + inside a collection opened this screen.
  const { parentId } = useLocalSearchParams<{ parentId?: string }>();

  const [name, setName] = useState('');

  // null until the switch is touched: the person's "new collections are
  // private" setting decides, here and in the database.
  const [isPrivate, setIsPrivate] = useState<boolean | null>(null);
  const settings = useSettings();
  const privateByDefault = settings.data?.newCollectionsPrivate ?? false;

  // What belongs in the collection, one piece of state per part of CollectionRules.
  const [regions, setRegions] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [placeTypes, setPlaceTypes] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);

  // null until the auto add row is tapped. See `isAutoAddOpen` below.
  const [showAutoAdd, setShowAutoAdd] = useState<boolean | null>(null);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [addExistingMatches, setAddExistingMatches] = useState(true);

  const createCollection = useCreateCollection();
  const isSaving = createCollection.isPending;
  const [errorMessage, setErrorMessage] = useState('');

  // What this collection is limited to by the ones it sits inside, if any.
  const ancestors = useRulesAbove(parentId);
  const ancestorLimits = describeLimits(ancestors.rules);

  // A sub-collection is almost always about narrowing something down, so the
  // auto add section starts open when there's a limit, rather than making
  // people find it.
  const isAutoAddOpen = showAutoAdd ?? ancestorLimits !== '';

  // The pickers' choices. Kinds of place and "best suited for" are the lists
  // the feed's filters use, because a rule has to use the same words as the
  // places it matches. Cities are the ones the app knows about, and any other
  // name can be typed in.
  const filterOptions = useFilterOptions();

  // "Best suited for" offers the SHARED tag vocabulary, not just the fixed
  // suited_for_tags list -- a profile's interests and a place's suited-for
  // tags are the same words, so a collection should be able to use any of
  // them. src/services/tags.ts explains why they're one list.
  //
  // Slugs rather than labels, because that's what a place stores in
  // places.suited_for and what the rules are matched against. Showing
  // "Remote work" but saving "remote work" would be nicer to read and a
  // nuisance to match.
  const peopleTags = useTags('interest');
  const suitedForOptions = (peopleTags.data ?? []).map((tag) => tag.slug);
  const knownCities = useCitySearch('');
  const cityNames = [...new Set((knownCities.data ?? []).map((city) => city.name))];

  const rules: CollectionRules = { regions, countries, cities, placeTypes, vibes };
  const hasRules = !isEmptyRules(rules);
  const summary = describeRules(rules);

  // Which already-saved places these rules would catch, for the "Add the 3
  // places that already match" row. A sub-collection is also limited by the
  // collections above it, so those rules count too. Empty rules match
  // nothing, so this is empty until something has been picked.
  const savedPlaces = useAllSavedPlaces();
  const matchingPlaces = (savedPlaces.data ?? []).filter((place) =>
    matchesWithAncestors(place, rules, ancestors.rules),
  );

  // Leaving this screen, whether the collection got made or not.
  //
  // router.back() on its own isn't safe: if this screen was opened straight
  // from a link, or the stack is otherwise empty, there's nothing to go back
  // to and the navigator throws "The action 'GO_BACK' was not handled by any
  // navigator". So check first, and otherwise go to where the + was: the
  // parent collection for a sub-collection, the Saved tab for a normal one.
  function leaveScreen() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (parentId !== undefined) {
      router.replace({ pathname: '/collection/[id]', params: { id: parentId } });
      return;
    }

    router.replace('/saved');
  }

  async function handleCreate() {
    setErrorMessage('');

    try {
      await createCollection.mutateAsync({
        name,
        parentId,
        isPrivate: isPrivate ?? undefined,
        rules: hasRules ? rules : undefined,
        autoAdd: hasRules && autoAdd,
        placeIds: hasRules && addExistingMatches ? matchingPlaces.map((place) => place.id) : [],
      });
      leaveScreen();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "That didn't work. Try again.");
    }
  }

  // Waits for the collections above this one, so the limit line doesn't
  // appear a moment after everything else.
  if (ancestors.isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  const regionOptions = showAllRegions ? REGION_NAMES : BROAD_REGIONS;

  return (
    <ScrollView
      // On iOS the header is see-through, so this keeps the content from
      // starting underneath it -- same as Place and Collection.
      contentInsetAdjustmentBehavior="automatic"
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* The header title. It's set here rather than in a layout because this
          screen lives in every tab's stack, so there's no single layout that
          owns it. */}
      <Stack.Screen options={{ title: 'New collection' }} />

      {/* --- The whole thing, for most people --- */}

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder={'Like “Bars in Japan” or “Weekend hikes”'}
        placeholderTextColor={colors.textMuted}
        autoFocus
        editable={!isSaving}
        returnKeyType="done"
      />

      {ancestorLimits !== '' && (
        <View style={styles.limitBox}>
          <Text style={styles.limitText}>
            Only places {ancestorLimits} can land in here, because of the collection this one
            sits inside.
          </Text>
        </View>
      )}

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchLabel}>Keep this collection private</Text>
          <Text style={styles.hint}>Only you can see it. It won&apos;t show on your profile.</Text>
        </View>
        <Switch value={isPrivate ?? privateByDefault} onValueChange={setIsPrivate} disabled={isSaving} />
      </View>

      {/* --- Everything else, folded away --- */}

      <Pressable
        onPress={() => setShowAutoAdd(!isAutoAddOpen)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isAutoAddOpen }}
        style={styles.foldRow}
      >
        <View style={styles.switchText}>
          <Text style={styles.switchLabel}>Add places automatically</Text>
          <Text style={styles.hintNoGap}>
            {summary === ''
              ? 'Fill it from what you save — cafes, anywhere in Europe, bars in Japan.'
              : summary}
          </Text>
        </View>
        <Icon name={isAutoAddOpen ? 'close' : 'add'} size={20} color={colors.textMuted} />
      </Pressable>

      {isAutoAddOpen && (
        <View style={styles.foldContents}>
          <Text style={styles.hint}>
            Pick nothing and you&apos;ll add places yourself. A kind of place and a where means
            both: &ldquo;Bars in Japan&rdquo;. Two of the same kind means either: &ldquo;Europe or
            Japan&rdquo;.
          </Text>

          <TagPicker
            label="Region"
            options={regionOptions}
            selected={regions}
            onChange={setRegions}
            multiple
            disabled={isSaving}
          />
          <Pressable onPress={() => setShowAllRegions(!showAllRegions)} accessibilityRole="button">
            <Text style={styles.link}>{showAllRegions ? 'Show fewer regions' : 'Show all regions'}</Text>
          </Pressable>

          <View style={styles.gap} />

          <SearchTagField
            label="Country"
            placeholder="Search countries"
            selected={countries}
            onChange={setCountries}
            options={COUNTRY_NAMES}
            disabled={isSaving}
          />

          <SearchTagField
            label="City"
            placeholder="Search cities"
            hint="Type any city. We only suggest the ones the app already knows."
            selected={cities}
            onChange={setCities}
            options={cityNames}
            allowNew
            disabled={isSaving}
          />

          <SearchTagField
            label="Kind of place"
            placeholder="Cafe, museum, garden…"
            selected={placeTypes}
            onChange={setPlaceTypes}
            options={filterOptions.placeTypes}
            disabled={isSaving}
          />

          <SearchTagField
            label="Best suited for"
            placeholder="Solo, adventure, budget…"
            hint="The same tags people pick when they post a place, and as their own interests."
            selected={vibes}
            onChange={setVibes}
            options={suitedForOptions}
            disabled={isSaving}
          />

          {summary !== '' && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>This collection is for</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          )}

          {hasRules && (
            <View style={styles.switchGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel}>Add matching places from now on</Text>
                  <Text style={styles.hint}>
                    A place can be in more than one collection, so it still lands in your others
                    too. Take one out by hand and it stays out.
                  </Text>
                </View>
                <Switch value={autoAdd} onValueChange={setAutoAdd} disabled={isSaving} />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel}>
                    Add the {matchingPlaces.length}{' '}
                    {matchingPlaces.length === 1
                      ? 'place that already matches'
                      : 'places that already match'}
                  </Text>
                  <Text style={styles.hint}>
                    {matchingPlaces.length === 0
                      ? 'Nothing you’ve saved matches yet.'
                      : matchingPlaces
                          .slice(0, 3)
                          .map((place) => place.name)
                          .join(', ') + (matchingPlaces.length > 3 ? ' and more' : '')}
                  </Text>
                </View>
                <Switch
                  value={addExistingMatches}
                  onValueChange={setAddExistingMatches}
                  disabled={isSaving || matchingPlaces.length === 0}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}

      <View style={styles.actions}>
        <Button
          label={isSaving ? 'Creating…' : 'Create'}
          align="stretch"
          onPress={handleCreate}
          disabled={name.trim() === '' || isSaving}
        />
        <Button
          label="Cancel"
          variant="secondary"
          align="stretch"
          onPress={leaveScreen}
          disabled={isSaving}
        />
      </View>
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
    paddingBottom: spacing.xl * 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  label: {
    fontWeight: 'bold',
    fontSize: type.body,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  // The name is the main thing on the screen, so it's bigger than a normal field.
  nameInput: {
    backgroundColor: colors.fill,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: type.title,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  hint: {
    fontSize: type.small,
    lineHeight: 17,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  hintNoGap: {
    fontSize: type.small,
    lineHeight: 17,
    color: colors.textMuted,
  },
  switchGroup: {
    marginTop: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontWeight: '600',
    fontSize: type.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  // The one row that opens everything else up.
  foldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.fill,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  foldContents: {
    paddingTop: spacing.xl,
  },
  link: {
    fontSize: type.label,
    color: colors.link,
    textDecorationLine: 'underline',
  },
  gap: {
    height: spacing.xl,
  },
  // What the collection above limits this one to.
  limitBox: {
    backgroundColor: colors.ice,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  limitText: {
    fontSize: type.small,
    lineHeight: 18,
    color: colors.periwinkleText,
  },
  // The one coloured panel: the rules read back as a sentence.
  summaryBox: {
    backgroundColor: colors.ice,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  summaryLabel: {
    fontSize: type.small,
    color: colors.periwinkleText,
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontWeight: '600',
    fontSize: type.heading,
    letterSpacing: -0.4,
    color: colors.text,
  },
  error: {
    fontSize: type.body,
    color: colors.roseText,
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
