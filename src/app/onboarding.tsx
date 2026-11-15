import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { Button, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthInput } from '@/components/auth-input';
import { OnboardingDropdown } from '@/components/onboarding-dropdown';
import { TagPicker } from '@/components/tag-picker';
import type { OnboardingFields } from '@/types/onboarding-fields';

const countries = [
  { label: 'Canada', value: 'CA' },
  { label: 'Dominican Republic', value: 'DO' },
  { label: 'Haiti', value: 'HT' },
  { label: 'Japan', value: 'JP' },
  { label: 'Nigeria', value: 'NG' },
  { label: 'United States', value: 'US' },
];

const ageRanges = ['18–24', '25–34', '35–44', '45–54', '55–64', '65+'].map(
  (range) => ({ label: range, value: range }),
);

const steps = ['homeCountry', 'ageRange', 'profilePicture', 'nextTrip', 'interests'] as const;

const hobbies = ['hiking', 'photography', 'food', 'museums'];

export default function OnboardingPage() {
  const [answers, setAnswers] = useState<OnboardingFields>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [photoError, setPhotoError] = useState('');
  const [previewComplete, setPreviewComplete] = useState(false);

  const [showOther, setShowOther] = useState(false);
  const [otherInterest, setOtherInterest] = useState('');

  const field = steps[stepIndex];
  const customInterest = showOther ? otherInterest.trim().toLowerCase() : '';
  const selectedHobbies = answers.interests ?? [];
  const canContinue = field === 'interests'
    ? selectedHobbies.length > 0 || Boolean(customInterest)
    : Boolean(answers[field]?.trim());

  function saveAnswer(value: string) {
    setPreviewComplete(false);
    if (field !== 'interests') {
      setAnswers((current) => ({ ...current, [field]: value }));
    }
  }

  function goBack() {
    setPreviewComplete(false);
    setPhotoError('');

    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/create-account');
    }
  }

  function goNext() {
    setPhotoError('');

    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setPreviewComplete(true);
    }
  }

  function skipStep() {
    setAnswers((current) => ({ ...current, [field]: undefined }));

    if (field === 'interests') {
      setOtherInterest('');
      setShowOther(false);
    }
    goNext();
  }

  async function pickPhoto() {
    setPhotoError('');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const photo = result.assets[0];
        setAnswers((current) => ({ ...current, profilePicture: photo.uri }));
      }
    } catch {
      setPhotoError('Could not open your photos. Please try again.');
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        style={[styles.pill, styles.back]}
      >
        <Text style={styles.arrow}>←</Text>
      </Pressable>

      <View style={styles.form}>
        <Text style={styles.progress}>Step {stepIndex + 1} of 5</Text>

        {(field === 'homeCountry' || field === 'ageRange') && (
          <OnboardingDropdown
            key={field}
            label={
              field === 'homeCountry'
                ? 'What country do you live in?'
                : 'What’s your age range?'
            }
            options={field === 'homeCountry' ? countries : ageRanges}
            value={answers[field]}
            onChange={saveAnswer}
          />
        )}

        {field === 'profilePicture' && (
          <View style={styles.photoSection}>
            <Text style={styles.question}>Add a profile photo</Text>

            {answers.profilePicture ? (
              <Image
                accessibilityLabel="Selected profile photo"
                source={{ uri: answers.profilePicture }}
                style={styles.photo}
              />
            ) : (
              <View
                accessible
                accessibilityLabel="No profile photo selected"
                style={[styles.photo, styles.photoPlaceholder]}
              >
                <View style={styles.placeholderHead} />
                <View style={styles.placeholderBody} />
              </View>
            )}

            <Button
              title={answers.profilePicture ? 'Change photo' : 'Choose a photo'}
              onPress={pickPhoto}
            />

            {photoError ? <Text>{photoError}</Text> : null}
          </View>
        )}

        {field === 'nextTrip' && (
          <AuthInput
            label="Where’s your next trip?"
            value={answers.nextTrip ?? ''}
            onChangeText={saveAnswer}
          />
        )}

        {field === 'interests' && (
          <>
            <TagPicker
              label="What are some of your interests?"
              options={[...hobbies, 'Other']}
              selected={showOther ? [...selectedHobbies, 'Other'] : selectedHobbies}
              multiple
              onChange={(choices) => {
                setPreviewComplete(false);
                setShowOther(choices.includes('Other'));
                setAnswers((current) => ({
                  ...current,
                  interests: choices.filter((choice) => choice !== 'Other'),
                }));
              }}
            />
            {showOther && (
              <AuthInput
                label="Type another interest"
                value={otherInterest}
                onChangeText={(text) => {
                  setPreviewComplete(false);
                  setOtherInterest(text);
                }}
              />
            )}
          </>
        )}

        <Button
          title={field === 'interests' ? 'Finish' : 'Continue'}
          onPress={goNext}
          disabled={!canContinue}
        />

        {field === 'profilePicture' && (
          <Text style={styles.halfway}>You’re halfway there!</Text>
        )}

        {previewComplete && (
          <Text accessibilityLiveRegion="polite">
            Preview complete. Interests:{' '}
            {[...new Set([...selectedHobbies, ...(customInterest ? [customInterest] : [])])].join(', ') || 'None selected'}
          </Text>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip this question"
        onPress={skipStep}
        style={[styles.pill, styles.skip]}
      >
        <Text style={styles.skipText}>Skip →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    gap: 12,
  },
  form: { flex: 1, justifyContent: 'center', gap: 16 },
  progress: { fontSize: 14, color: '#555' },
  halfway: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  question: { fontSize: 22, fontWeight: '600' },
  photoSection: { gap: 12 },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignSelf: 'center',
    backgroundColor: '#E5E7EB',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderHead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#9CA3AF',
  },
  placeholderBody: {
    width: 50,
    height: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: '#9CA3AF',
  },
  pill: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { alignSelf: 'flex-start' },
  skip: { alignSelf: 'flex-end' },
  arrow: { fontSize: 22, color: '#25274A' },
  skipText: { fontSize: 15, fontWeight: '600', color: '#25274A' },
});