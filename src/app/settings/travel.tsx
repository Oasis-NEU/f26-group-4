import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { OptionPills } from '@/components/option-pills';
import { SettingsRow } from '@/components/settings-row';
import { useUserId } from '@/hooks/use-session';
import { getProfile, updateProfile } from '@/services/users';
import type { TravelGoal } from '@/types/profile';

const CURRENT_YEAR = new Date().getFullYear();

const METRIC_OPTIONS: { value: TravelGoal['metric']; label: string }[] = [
  { value: 'countries', label: 'Countries' },
  { value: 'cities', label: 'Cities' },
  { value: 'places', label: 'Places' },
];

const TARGET_OPTIONS: { value: '3' | '5' | '10'; label: string }[] = [
  { value: '3', label: '3' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
];

export default function TravelScreen() {
  const userId = useUserId();
  const [goal, setGoal] = useState<TravelGoal | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      getProfile(userId).then((profile) => {
        if (!isActive || !profile) return;
        setGoal(profile.goals?.find((g) => g.year === CURRENT_YEAR) ?? { year: CURRENT_YEAR, metric: 'countries', target: 3 });
      });
      return () => {
        isActive = false;
      };
    }, [userId]),
  );

  async function saveGoal(next: TravelGoal) {
    setGoal(next);
    // Goals are saved one per year, so this only touches this year's.
    await updateProfile({ goals: [next] });
  }

  if (!goal) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>{CURRENT_YEAR} GOAL</Text>
      <View style={styles.card}>
        <View style={styles.pillSection}>
          <Text style={styles.pillLabel}>Track</Text>
          <OptionPills options={METRIC_OPTIONS} selected={goal.metric} onSelect={(metric) => saveGoal({ ...goal, metric })} />
        </View>
        <View style={[styles.pillSection, styles.pillSectionLast]}>
          <Text style={styles.pillLabel}>Target</Text>
          <OptionPills
            options={TARGET_OPTIONS}
            selected={String(goal.target) as '3' | '5' | '10'}
            onSelect={(target) => saveGoal({ ...goal, target: Number(target) })}
          />
        </View>
      </View>
      <Text style={styles.footnote}>Shown on the Badges tab. Progress is calculated from your posts.</Text>

      <Text style={styles.sectionLabel}>UNITS</Text>
      <View style={styles.card}>
        <SettingsRow title="Distance units" subtitle="TBD" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pillSection: {
    padding: 16,
    gap: 8,
  },
  pillSectionLast: {
    paddingBottom: 16,
  },
  pillLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  footnote: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
});
