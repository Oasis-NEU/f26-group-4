import { StyleSheet, Text, View } from 'react-native';

// THEME CODE -- design system. See profile-header.tsx for the convention.
import { colors, radius, spacing, type } from '@/theme';

// The "Complete your profile" card on your own profile. Four steps, calculated
// from the profile + counts each time (nothing about "completeness" is stored).
// Hides itself once all four are done.

export type ChecklistStep = {
  id: 'photo' | 'bio' | 'firstPost' | 'follow3';
  label: string;
  done: boolean;
};

export type ChecklistInput = {
  hasProfilePhoto: boolean;
  hasBio: boolean;
  postsCount: number;
  followingCount: number;
};

export function getChecklistSteps(input: ChecklistInput): ChecklistStep[] {
  return [
    { id: 'photo', label: 'Add a profile photo', done: input.hasProfilePhoto },
    { id: 'bio', label: 'Add a bio', done: input.hasBio },
    { id: 'firstPost', label: 'Make your first post', done: input.postsCount > 0 },
    { id: 'follow3', label: 'Follow 3 people', done: input.followingCount >= 3 },
  ];
}

type ProfileChecklistProps = {
  input: ChecklistInput;
};

export function ProfileChecklist({ input }: ProfileChecklistProps) {
  const steps = getChecklistSteps(input);
  const doneCount = steps.filter((step) => step.done).length;

  if (doneCount === steps.length) {
    return null; // fully done -- nothing to show
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Complete your profile ({doneCount}/{steps.length})
      </Text>
      {steps.map((step) => (
        <View key={step.id} style={styles.row}>
          <Text style={styles.checkbox}>{step.done ? '✓' : '○'}</Text>
          <Text style={[styles.label, step.done && styles.labelDone]}>{step.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.fill,
    gap: spacing.sm,
  },
  title: {
    fontSize: type.body,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 18,
    textAlign: 'center',
    color: colors.text,
  },
  label: {
    fontSize: type.small,
    color: colors.text,
  },
  labelDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
