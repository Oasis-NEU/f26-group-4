import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { StatusSharing } from '@/types/profile';

// Three independent checkboxes for how much of a status to share -- country,
// city and dates -- replacing the old single "how much" ladder (hidden ->
// country -> city -> full). Dates only has an effect when country is also on
// (see trimStatus in status-text.ts), but this doesn't block picking it on
// its own; the live "they'd see: ..." preview next to this already makes
// that obvious.

type SharingTogglesProps = {
  value: StatusSharing;
  onChange: (value: StatusSharing) => void;
};

const FIELDS: { key: keyof StatusSharing; label: string }[] = [
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'dates', label: 'Dates' },
];

export function SharingToggles({ value, onChange }: SharingTogglesProps) {
  return (
    <View style={styles.row}>
      {FIELDS.map(({ key, label }) => {
        const checked = value[key];
        return (
          <Pressable
            key={key}
            style={[styles.pill, checked && styles.pillChecked]}
            onPress={() => onChange({ ...value, [key]: !checked })}
          >
            <View style={[styles.box, checked && styles.boxChecked]}>{checked && <Text style={styles.check}>✓</Text>}</View>
            <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pillChecked: {
    borderColor: '#2A9D8F',
  },
  box: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  check: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelChecked: {
    color: '#2A9D8F',
  },
});
