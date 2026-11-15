import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, radius, spacing, type } from '@/theme';
import { AuthInput } from '@/components/auth-input';
import { RatingStars } from '@/components/rating-stars';
import { SearchTagField } from '@/components/search-tag-field';
import { UploadMediaPicker } from '@/components/upload-media-picker';
import type { UploadFields } from '@/types/upload-fields';
import { searchCountries } from '@/lib/countries';
import { searchCityNames } from '@/services/cities';
import { searchTags } from '@/services/interests';

// ---------------------------------------------------------------------------
// NOTE (Ruby, from the collections work) -- this page isn't mine, so here's
// what changed and why. Revert any of it if you disagree.
//
// There used to be two hardcoded lists here: five place types and five
// "suited for" options. That capped what anyone could ever post -- you could
// not add a museum, a bar or a ski run, and the collection rules on the Saved
// tab could only ever offer the same five things back.
//
// They now come from src/services/interests.ts, which is one growing list of
// tags shared with profile interests. searchTags('place-type', text) and
// searchTags('interest', text) search it, and anything typed that isn't in it
// yet gets offered as "Add ...". City and Country changed from free text to
// the same kind of picker, so a place's country is spelled the same way every
// time and a "Places in Japan" collection can actually match it.
//
// STILL TO DO, on whoever builds the Post button: when the post is saved, call
// addTag('place-type', ...) / addTag('interest', ...) from interests.ts for
// anything the user typed that was new, so the tag exists for everyone else.
// Picking it here doesn't add it to the shared list on its own.
// ---------------------------------------------------------------------------

export default function UploadPage() {
  // Information entered on the form.
  const [fields, setFields] = useState<UploadFields>({
    placeName: '',
    address: '',
    city: '',
    country: '',
    rating: 0,
    reviewText: '',
    media: [],
    placeType: '',
    suitedFor: [],
  });

  // What each picker searches. useCallback keeps them the same function
  // between renders, so a picker doesn't search again every time another one
  // changes.
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

  return (
    // On iOS the header is see-through, so this keeps the content from starting underneath it.
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>New post</Text>

      <AuthInput
        label="Place name"
        value={fields.placeName}
        onChangeText={(text) =>
          setFields((current) => ({
            ...current,
            placeName: text,
          }))
        }
      />

      <AuthInput
        label="Address"
        value={fields.address}
        onChangeText={(text) =>
          setFields((current) => ({
            ...current,
            address: text,
          }))
        }
      />

      <SearchTagField
        label="City"
        placeholder="Search cities"
        hint="Type any city. We only suggest the ones the app already knows."
        multiple={false}
        allowNew
        selected={fields.city === '' ? [] : [fields.city]}
        onChange={(selected) =>
          setFields((current) => ({
            ...current,
            city: selected[0] ?? '',
          }))
        }
        search={findCities}
      />

      <SearchTagField
        label="Country"
        placeholder="Search countries"
        multiple={false}
        selected={fields.country === '' ? [] : [fields.country]}
        onChange={(selected) =>
          setFields((current) => ({
            ...current,
            country: selected[0] ?? '',
          }))
        }
        search={findCountries}
      />

      <RatingStars
        rating={fields.rating}
        onChange={(rating) =>
          setFields((current) => ({
            ...current,
            rating,
          }))
        }
      />

      <UploadMediaPicker
        media={fields.media}
        onChange={(media) =>
          setFields((current) => ({
            ...current,
            media,
          }))
        }
      />

      <Text style={styles.label}>Your post</Text>

      <TextInput
        accessibilityLabel="Your post"
        style={styles.review}
        multiline
        placeholder="What was your experience?"
        value={fields.reviewText}
        onChangeText={(text) =>
          setFields((current) => ({
            ...current,
            reviewText: text,
          }))
        }
      />

      <SearchTagField
        label="Place type"
        placeholder="Cafe, hike, bar…"
        hint="Pick one. If it isn't here, type it and tap Add."
        multiple={false}
        allowNew
        selected={fields.placeType === '' ? [] : [fields.placeType]}
        onChange={(selected) =>
          setFields((current) => ({
            ...current,
            placeType: selected[0] ?? '',
          }))
        }
        search={findPlaceTypes}
      />

      <SearchTagField
        label="Suited for"
        placeholder="Solo, adventure, budget…"
        hint="Choose as many as fit. These are the same tags people pick as interests on their profile."
        allowNew
        selected={fields.suitedFor}
        onChange={(selected) =>
          setFields((current) => ({
            ...current,
            suitedFor: selected,
          }))
        }
        search={findVibes}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// THEME CODE (design system) -- Ruby
//
// Colours, corner radius and spacing now come from src/theme.ts instead of
// being typed in here. These are LOOKS ONLY -- no logic changed, nothing moved,
// no props changed. Anything marked THEME CODE is safe to ignore while you work.
//
// To change a colour, change it in src/theme.ts so every screen updates, rather
// than putting a hex code back in here.
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontWeight: 'bold',
    fontSize: type.screenTitle,
    letterSpacing: -1,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  label: {
    fontWeight: '500',
    fontSize: type.body,
    marginBottom: 6,
    color: colors.text,
  },
  review: {
    minHeight: 120,
    // Grey fill instead of an outline, same as every other input.
    backgroundColor: colors.fill,
    borderRadius: radius.card,
    padding: spacing.lg,
    fontSize: type.body,
    color: colors.text,
    textAlignVertical: 'top',
    marginBottom: spacing.xl,
  },
});