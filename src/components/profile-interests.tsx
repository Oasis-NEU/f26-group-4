import { StyleSheet, View } from 'react-native';

import { Tag } from '@/components/ui';
// THEME CODE -- design system. See profile-header.tsx for the convention.
import { spacing } from '@/theme';

// Shows a profile's hobbies/interests as a row of small tags ("chips"),
// e.g. ["hiking", "photography"] -> two little pill-shaped labels.

type ProfileInterestsProps = {
  interests: string[]; // e.g. ["hiking", "photography"]
};

export function ProfileInterests({ interests }: ProfileInterestsProps) {
  if (interests.length === 0) {
    return null; // nothing to show, so render nothing
  }

  return (
    <View style={styles.container}>
      {interests.map((interest) => (
        <Tag key={interest} label={interest} size="small" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
});
