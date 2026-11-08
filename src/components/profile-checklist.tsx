import { StyleSheet, Text, View } from 'react-native';

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
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
  },
  labelDone: {
    color: 'gray',
    textDecorationLine: 'line-through',
  },
});
