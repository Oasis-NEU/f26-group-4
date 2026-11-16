import { type ComponentRef, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';

import { AuthInput } from '@/components/auth-input';
import { RatingStars } from '@/components/rating-stars';
import { SearchTagField } from '@/components/search-tag-field';
import { UploadMediaPicker } from '@/components/upload-media-picker';
import { useCitySearch } from '@/hooks/use-cities';
import { useFilterOptions } from '@/hooks/use-places';
import { useTags } from '@/hooks/use-tags';
import { useCreatePost } from '@/hooks/use-reviews';
import { COUNTRY_NAMES } from '@/lib/countries';
import type { UploadFields } from '@/types/upload-fields';
import { validatePost } from '@/utils/validate-post';

// ---------------------------------------------------------------------------
// NOTE (Ruby, from the collections work) -- this page isn't mine, so here's
// what changed and why. Revert any of it if you disagree.
//
// There used to be two hardcoded lists here: five place types and five
// "suited for" options. That capped what anyone could ever post -- you could
// not add a museum or a garden, and the collection rules on the Saved tab
// could only ever offer the same five things back.
//
// They now come from the database. Place type is the fixed place_types list
// (it's a foreign key, so only a migration can grow it). "Suited for" is the
// SHARED TAG VOCABULARY from src/services/tags.ts: the suited_for_tags list
// AND everyone's profile interests, as one list. They're the same words --
// `photography` and `adventure` are literally rows in both tables -- and
// keeping them together is what will let the app say "this place suits you"
// by comparing a person's interests to a place's tags. The New collection
// screen offers the same list, so a post and a "Cafes in Japan" collection
// use the same words. City and Country changed from free text to the same
// kind of picker, so a place's country is spelled the same way every time and
// a "Places in Japan" collection can actually match it. Any city can still be
// typed in; create_review() adds it if it's new. The photo's location still
// fills both in.
// ---------------------------------------------------------------------------

const locationHint =
  'Add a photo with GPS data to fill the location automatically.';

const textFields = [
  { key: 'placeName', label: 'Place name *' },
  { key: 'address', label: 'Address (optional)' },
] as const;

type PhotoLocation = {
  latitude: number;
  longitude: number;
};

function emptyFields(): UploadFields {
  return {
    placeName: '',
    address: '',
    city: '',
    country: '',
    rating: 0,
    reviewText: '',
    media: [],
    placeType: '',
    suitedFor: [],
  };
}

// A new place's coordinates: the photo's GPS data if there was any, otherwise
// the typed address looked up on the phone (iOS and Android only). Without
// either, the post still saves; the place just stays off the map.
async function findCoordinates(fields: UploadFields): Promise<{ latitude?: number; longitude?: number }> {
  if (fields.latitude !== undefined && fields.longitude !== undefined) {
    return { latitude: fields.latitude, longitude: fields.longitude };
  }
  if (Platform.OS === 'web') return {};

  try {
    if (Platform.OS === 'android') {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return {};
    }
    const address = [fields.address, fields.city, fields.country].filter((part) => part.trim()).join(', ');
    const [match] = await Location.geocodeAsync(address);
    return match ? { latitude: match.latitude, longitude: match.longitude } : {};
  } catch {
    return {};
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Text accessibilityRole="alert" style={styles.fieldError}>
      {message}
    </Text>
  );
}

export default function UploadPage() {
  const createPost = useCreatePost();
  const filterOptions = useFilterOptions();

  // The shared vocabulary for "suited for". Slugs, not labels, because that's
  // what places.suited_for stores and what collection rules match against.
  const peopleTags = useTags('interest');
  const suitedForOptions = (peopleTags.data ?? []).map((tag) => tag.slug);
  const knownCities = useCitySearch('');
  const cityNames = [...new Set((knownCities.data ?? []).map((city) => city.name))];
  const [fields, setFields] = useState<UploadFields>(emptyFields);
  const [attempted, setAttempted] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saved, setSaved] = useState(false);

  const [locationMessage, setLocationMessage] =
    useState(locationHint);
  const [isFindingLocation, setIsFindingLocation] =
    useState(false);

  const latestLookup = useRef(0);
  const posting = useRef(false);
  const scrollView = useRef<ComponentRef<typeof ScrollView>>(null);

  const errors = attempted ? validatePost(fields) : {};
  const hasErrors = Object.keys(errors).length > 0;
  const busy = isPosting || isFindingLocation;

  function updateField<K extends keyof UploadFields>(
    key: K,
    value: UploadFields[K]
  ) {
    if (posting.current) return;

    setFields((current) => ({
      ...current,
      [key]: value,
    }));
    setSubmitError('');
  }

  async function fillPhotoLocation(coordinates: PhotoLocation) {
    if (posting.current) return;

    const lookupId = ++latestLookup.current;

    // Keep the photo's coordinates for the new place, so it can go on the map.
    setFields((current) => ({ ...current, latitude: coordinates.latitude, longitude: coordinates.longitude }));

    setIsFindingLocation(true);
    setLocationMessage('Finding the photo’s location…');

    try {
      if (Platform.OS === 'web') {
        setLocationMessage(
          'Photo location autofill is available in the mobile app. Enter the location manually.'
        );
        return;
      }

      if (Platform.OS === 'android') {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (lookupId !== latestLookup.current) return;

        if (!permission.granted) {
          setLocationMessage(
            'Address lookup permission was denied. Enter the location manually.'
          );
          return;
        }
      }

      const [place] =
        await Location.reverseGeocodeAsync(coordinates);

      if (lookupId !== latestLookup.current) return;

      if (!place) {
        setLocationMessage(
          'No address found for this photo. Enter the location manually.'
        );
        return;
      }

      const address = [place.streetNumber, place.street]
        .filter(Boolean)
        .join(' ');
      const city = place.city || place.subregion || '';
      const country = place.country || '';

      if (!address && !city && !country) {
        setLocationMessage(
          'No address found for this photo. Enter the location manually.'
        );
        return;
      }

      setFields((current) => ({
        ...current,
        address: current.address.trim()
          ? current.address
          : address,
        city: current.city.trim() ? current.city : city,
        country: current.country.trim()
          ? current.country
          : country,
      }));

      setLocationMessage(
        'Photo location found. Check the details below. Existing entries have been kept.'
      );
    } catch {
      if (lookupId === latestLookup.current) {
        setLocationMessage(
          'Could not look up the photo’s location. Enter it manually below.'
        );
      }
    } finally {
      if (lookupId === latestLookup.current) {
        setIsFindingLocation(false);
      }
    }
  }

  async function handlePost() {
    if (posting.current || isFindingLocation) return;

    setAttempted(true);
    setSubmitError('');

    const validationErrors = validatePost(fields);

    if (Object.keys(validationErrors).length > 0) {
      scrollView.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    // The ref blocks repeated taps immediately.
    posting.current = true;
    setIsPosting(true);

    try {
      await createPost.mutateAsync({ ...fields, ...(await findCoordinates(fields)) });
      setSaved(true);
      scrollView.current?.scrollTo({ y: 0, animated: true });
    } catch {
      setSubmitError(
        'Your post could not be saved. Your entries are still here. Please try again.'
      );
    } finally {
      posting.current = false;
      setIsPosting(false);
    }
  }

  function startNewPost() {
    latestLookup.current += 1;
    setFields(emptyFields());
    setAttempted(false);
    setSubmitError('');
    setLocationMessage(locationHint);
    setIsFindingLocation(false);
    setSaved(false);
  }

  if (saved) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.title}>Post saved</Text>

        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          Your review is now on the place&apos;s page and in the Feed.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={startNewPost}
          style={styles.postButton}
        >
          <Text style={styles.postButtonText}>
            Create another post
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollView}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>New post</Text>

      <Text style={styles.hint}>
        Fields marked * are required.
      </Text>

      {hasErrors && (
        <Text accessibilityRole="alert" style={styles.errorBanner}>
          Please complete the highlighted fields below.
        </Text>
      )}

      <View
        style={{ pointerEvents: isPosting ? 'none' : 'auto' }}
        accessibilityElementsHidden={isPosting}
        importantForAccessibility={
          isPosting ? 'no-hide-descendants' : 'auto'
        }
      >
        <UploadMediaPicker
          media={fields.media}
          disabled={busy}
          onChange={(media) => {
            updateField('media', media);

            if (media.length === 0) {
              setLocationMessage(locationHint);
            }
          }}
          onPhotoLocation={fillPhotoLocation}
        />

        <FieldError message={errors.media} />

        <Text
          accessibilityLiveRegion="polite"
          style={styles.hint}
        >
          {locationMessage}
        </Text>

        {textFields.map(({ key, label }) => (
          <View key={key}>
            <AuthInput
              label={label}
              value={fields[key]}
              onChangeText={(text) => updateField(key, text)}
            />
            <FieldError message={errors[key]} />
          </View>
        ))}

        <SearchTagField
          label="City *"
          placeholder="Search cities"
          hint="Type any city. We only suggest the ones the app already knows."
          multiple={false}
          allowNew
          selected={fields.city === '' ? [] : [fields.city]}
          onChange={(selected) => updateField('city', selected[0] ?? '')}
          options={cityNames}
          disabled={isPosting}
        />

        <FieldError message={errors.city} />

        <SearchTagField
          label="Country *"
          placeholder="Search countries"
          multiple={false}
          selected={fields.country === '' ? [] : [fields.country]}
          onChange={(selected) => updateField('country', selected[0] ?? '')}
          options={COUNTRY_NAMES}
          disabled={isPosting}
        />

        <FieldError message={errors.country} />

        <RatingStars
          rating={fields.rating}
          onChange={(rating) => updateField('rating', rating)}
        />

        <FieldError message={errors.rating} />

        <Text style={styles.label}>Your post *</Text>

        <TextInput
          accessibilityLabel="Your post, required"
          style={[
            styles.review,
            errors.reviewText ? styles.invalidInput : undefined,
          ]}
          multiline
          editable={!isPosting}
          placeholder="What was your experience?"
          value={fields.reviewText}
          onChangeText={(text) =>
            updateField('reviewText', text)
          }
        />

        <FieldError message={errors.reviewText} />

        <SearchTagField
          label="Place type *"
          placeholder="Cafe, museum, garden…"
          hint="Pick one."
          multiple={false}
          selected={fields.placeType ? [fields.placeType] : []}
          onChange={(selected) =>
            updateField('placeType', selected[0] ?? '')
          }
          options={filterOptions.placeTypes}
          disabled={isPosting}
        />

        <FieldError message={errors.placeType} />

        <SearchTagField
          label="Suited for — optional"
          placeholder="Solo, adventure, budget…"
          hint="Choose as many as fit. These are the same tags people pick as their own interests."
          selected={fields.suitedFor}
          onChange={(selected) =>
            updateField('suitedFor', selected)
          }
          options={suitedForOptions}
          disabled={isPosting}
        />
      </View>

      {!!submitError && (
        <Text accessibilityRole="alert" style={styles.errorBanner}>
          {submitError}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: busy,
          busy: isPosting,
        }}
        disabled={busy}
        onPress={handlePost}
        style={({ pressed }) => [
          styles.postButton,
          busy ? styles.disabledButton : undefined,
          pressed && !busy ? styles.pressedButton : undefined,
        ]}
      >
        {isPosting && <ActivityIndicator color="#FFFFFF" />}

        <Text style={styles.postButtonText}>
          {isPosting
            ? 'Posting…'
            : isFindingLocation
              ? 'Finding location…'
              : submitError
                ? 'Try again'
                : 'Post'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  hint: {
    color: '#555',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    marginTop: 12,
  },
  review: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  invalidInput: {
    borderColor: '#B42318',
  },
  fieldError: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  errorBanner: {
    color: '#8A1C13',
    backgroundColor: '#FEECE9',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
    lineHeight: 21,
  },
  postButton: {
    backgroundColor: '#315D49',
    borderRadius: 10,
    minHeight: 52,
    padding: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressedButton: {
    opacity: 0.8,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});