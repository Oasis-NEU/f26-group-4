import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Button, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthInput } from '@/components/auth-input';
import { OnboardingDropdown } from '@/components/onboarding-dropdown';
import { TagPicker } from '@/components/tag-picker';
import { useSession } from '@/hooks/use-session';
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
  const { finishOnboarding } = useSession();
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState('');

  const [showOther, setShowOther] = useState(false);
  const [otherInterest, setOtherInterest] = useState('');

  const field = steps[stepIndex];
  const customInterest = showOther ? otherInterest.trim().toLowerCase() : '';
  const selectedHobbies = answers.interests ?? [];
  const canContinue = field === 'interests'
    ? selectedHobbies.length > 0 || Boolean(customInterest)
    : Boolean(answers[field]?.trim());

  function saveAnswer(value: string) {
    setFinishError('');
    if (field !== 'interests') {
      setAnswers((current) => ({ ...current, [field]: value }));
    }
  }

  function goBack() {
    setFinishError('');
    setPhotoError('');

    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  }

  async function goNext() {
    if (isFinishing) return;
    setPhotoError('');

    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setIsFinishing(true);
      setFinishError('');
      try {
        await finishOnboarding();
      } catch {
        setFinishError('Could not finish setup. Please try again.');
        setIsFinishing(false);
      }
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        disabled={stepIndex === 0 || isFinishing}
        accessibilityState={{ disabled: stepIndex === 0 || isFinishing }}
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
                setFinishError('');
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
                  setFinishError('');
                  setOtherInterest(text);
                }}
              />
            )}
          </>
        )}

        <Button
          title={field === 'interests' ? 'Finish' : 'Continue'}
          onPress={goNext}
          disabled={!canContinue || isFinishing}
        />

        {field === 'profilePicture' && (
          <Text style={styles.halfway}>You’re halfway there!</Text>
        )}

        {isFinishing && <Text>Finishing setup…</Text>}
        {finishError ? <Text accessibilityRole="alert">{finishError}</Text> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip this question"
        onPress={skipStep}
        disabled={isFinishing}
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