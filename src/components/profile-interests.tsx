import { StyleSheet, Text, View } from 'react-native';

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
        <View key={interest} style={styles.chip}>
          <Text>{interest}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
});
