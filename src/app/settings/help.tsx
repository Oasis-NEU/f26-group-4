import { ScrollView, StyleSheet, View } from 'react-native';

import { SettingsRow } from '@/components/settings-row';

export default function HelpScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <SettingsRow title="Report a problem" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingsRow title="Terms of service" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingsRow title="Privacy policy" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingsRow title="App version" subtitle="1.0.0" />
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 16,
  },
});
