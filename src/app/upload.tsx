import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { AuthInput } from '@/components/auth-input';
import { RatingStars } from '@/components/rating-stars';
import { TagPicker } from '@/components/tag-picker';
import { UploadMediaPicker } from '@/components/upload-media-picker';
import type { UploadFields } from '@/types/upload-fields';

// Starter choices. These can be changed later.
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

      <AuthInput
        label="City"
        value={fields.city}
        onChangeText={(text) =>
          setFields((current) => ({
            ...current,
            city: text,
          }))
        }
      />

      <AuthInput
        label="Country"
        value={fields.country}
        onChangeText={(text) =>
          setFields((current) => ({
            ...current,
            country: text,
          }))
        }
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

      <Text style={styles.label}>Your review</Text>

      <TextInput
        accessibilityLabel="Your review"
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

      <TagPicker
        label="Place type — choose one"
        options={placeTypes}
        selected={fields.placeType ? [fields.placeType] : []}
        onChange={(selected) =>
          setFields((current) => ({
            ...current,
            placeType: selected[0] ?? '',
          }))
        }
      />

      <TagPicker
        label="Suited for — choose several"
        options={suitedForOptions}
        selected={fields.suitedFor}
        multiple={true}
        onChange={(selected) =>
          setFields((current) => ({
            ...current,
            suitedFor: selected,
          }))
        }
      />
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
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  review: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
});