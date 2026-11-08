import { useRef, useState } from 'react';
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
import { TagPicker } from '@/components/tag-picker';
import { UploadMediaPicker } from '@/components/upload-media-picker';
import { createPost, validatePost } from '@/services/posts';
import type { UploadFields } from '@/types/upload-fields';

const placeTypes = [
  'Cafe',
  'Restaurant',
  'Excursion',
  'Sport',
  'Other',
];

const suitedForOptions = [
  'Solo',
  'Friends',
  'Families',
  'Adventure',
  'Skiers',
];

const locationHint =
  'Add a photo with GPS data to fill the location automatically.';

const textFields = [
  { key: 'placeName', label: 'Place name *' },
  { key: 'address', label: 'Address (optional)' },
  { key: 'city', label: 'City *' },
  { key: 'country', label: 'Country *' },
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Text accessibilityRole="alert" style={styles.fieldError}>
      {message}
    </Text>
  );
}

export default function UploadPage() {
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
  const scrollView = useRef<ScrollView>(null);

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
      await createPost(fields);
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
        <Text style={styles.title}>Demo post saved</Text>

        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          Your post was saved for this app session. It is not
          published online and will disappear when the app reloads.
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
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>New post</Text>

      <Text style={styles.hint}>
        Fields marked * are required. Posts are saved for this
        demo session only.
      </Text>

      {hasErrors && (
        <Text accessibilityRole="alert" style={styles.errorBanner}>
          Please complete the highlighted fields below.
        </Text>
      )}

      <View
        pointerEvents={isPosting ? 'none' : 'auto'}
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

        <RatingStars
          rating={fields.rating}
          onChange={(rating) => updateField('rating', rating)}
        />

        <FieldError message={errors.rating} />

        <Text style={styles.label}>Your review *</Text>

        <TextInput
          accessibilityLabel="Your review, required"
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

        <TagPicker
          label="Place type * — choose one"
          options={placeTypes}
          selected={fields.placeType ? [fields.placeType] : []}
          onChange={(selected) =>
            updateField('placeType', selected[0] ?? '')
          }
        />

        <FieldError message={errors.placeType} />

        <TagPicker
          label="Suited for — optional"
          options={suitedForOptions}
          selected={fields.suitedFor}
          multiple={true}
          onChange={(selected) =>
            updateField('suitedFor', selected)
          }
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