import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { SearchTagField } from '@/components/search-tag-field';
import { TagPicker } from '@/components/tag-picker';
import { Button, Icon } from '@/components/ui';
import { describeRules, isEmptyRules } from '@/lib/collection-rules';
import { searchCountries } from '@/lib/countries';
import { REGION_NAMES } from '@/lib/regions';
import { searchCityNames } from '@/services/cities';
import {
  createCollection,
  describeAncestorLimits,
  getMatchingSavedPlaces,
} from '@/services/collections';
import { searchTags } from '@/services/interests';
import { colors, radius, spacing, type } from '@/theme';
import { CollectionRules } from '@/types/collection';
import { Place } from '@/types/place';

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
  const [isPrivate, setIsPrivate] = useState(false);

  // What belongs in the collection, one piece of state per part of CollectionRules.
  const [regions, setRegions] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [placeTypes, setPlaceTypes] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);

  const [showAutoAdd, setShowAutoAdd] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [addExistingMatches, setAddExistingMatches] = useState(true);

  const [matchingPlaces, setMatchingPlaces] = useState<Place[]>([]);
  const [ancestorLimits, setAncestorLimits] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // What this collection is limited to by the one it sits inside, if any.
  useEffect(() => {
    describeAncestorLimits(parentId).then((limits) => {
      setAncestorLimits(limits);

      // A sub-collection is almost always about narrowing something down, so
      // open the auto-add section rather than making people find it.
      if (limits !== '') {
        setShowAutoAdd(true);
      }

      setIsLoading(false);
    });
  }, [parentId]);

  // The pickers want a function that takes what's been typed and gives back
  // the choices. useCallback keeps each one the same function between renders,
  // so SearchTagField doesn't search again on every keystroke of a different box.
  const findCountries = useCallback(async (query: string) => {
    return searchCountries(query).map((country) => country.name);
  }, []);

  const findCities = useCallback(async (query: string) => {
    return searchCityNames(query);
  }, []);

  const findPlaceTypes = useCallback(async (query: string) => {
    const tags = await searchTags('place-type', query);
    return tags.map((tag) => tag.name);
  }, []);

  const findVibes = useCallback(async (query: string) => {
    const tags = await searchTags('interest', query);
    return tags.map((tag) => tag.name);
  }, []);

  const rules: CollectionRules = { regions, countries, cities, placeTypes, vibes };
  const hasRules = !isEmptyRules(rules);
  const summary = describeRules(rules);

  // How many already-saved places these rules would catch, for the
  // "Add the 3 places that already match" row. Worked out by the service, not
  // here, because a sub-collection is also limited by the collections above
  // it and only the service knows about those. Empty rules match nothing, so
  // this gives back an empty list until something has been picked.
  useEffect(() => {
    let ignore = false;

    // Built inside the effect rather than used from above, because `rules` is
    // a new object on every render and would set this running in a loop.
    const current: CollectionRules = { regions, countries, cities, placeTypes, vibes };

    getMatchingSavedPlaces(current, parentId).then((places) => {
      if (!ignore) {
        setMatchingPlaces(places);
      }
    });

    return () => {
      ignore = true;
    };
  }, [parentId, regions, countries, cities, placeTypes, vibes]);

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
    setIsSaving(true);

    try {
      await createCollection({
        name,
        parentId,
        isPrivate,
        rules: hasRules ? rules : undefined,
        autoAdd: hasRules && autoAdd,
        addExistingMatches: hasRules && addExistingMatches,
      });
      leaveScreen();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "That didn't work. Try again.");
      setIsSaving(false);
    }
  }

  if (isLoading) {
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
        <Switch value={isPrivate} onValueChange={setIsPrivate} disabled={isSaving} />
      </View>

      {/* --- Everything else, folded away --- */}

      <Pressable
        onPress={() => setShowAutoAdd(!showAutoAdd)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showAutoAdd }}
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
        <Icon name={showAutoAdd ? 'close' : 'add'} size={20} color={colors.textMuted} />
      </Pressable>

      {showAutoAdd && (
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
            search={findCountries}
            disabled={isSaving}
          />

          <SearchTagField
            label="City"
            placeholder="Search cities"
            hint="Type any city. We only suggest the ones the app already knows."
            selected={cities}
            onChange={setCities}
            search={findCities}
            allowNew
            disabled={isSaving}
          />

          <SearchTagField
            label="Kind of place"
            placeholder="Cafe, hike, bar…"
            selected={placeTypes}
            onChange={setPlaceTypes}
            search={findPlaceTypes}
            allowNew
            disabled={isSaving}
          />

          <SearchTagField
            label="Best suited for"
            placeholder="Solo, adventure, budget…"
            hint="The same tags people put on their profile as interests."
            selected={vibes}
            onChange={setVibes}
            search={findVibes}
            allowNew
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
