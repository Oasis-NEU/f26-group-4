import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// One row in a Settings list: a title, an optional subtitle, and either a
// chevron (tappable, navigates somewhere) or custom content on the right
// (a Switch, for instance). Used across every Settings screen so they share
// one look instead of each screen rolling its own row styling.

type SettingsRowProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void; // omit for a non-navigating row (e.g. one with just a Switch)
  right?: ReactNode; // replaces the default chevron, e.g. a Switch
  destructive?: boolean; // red title, for things like "Delete account"
};

export function SettingsRow({ title, subtitle, onPress, right, destructive = false }: SettingsRowProps) {
  const content = (
    <View style={styles.row}>
      <View style={styles.textColumn}>
        <Text style={[styles.title, destructive && styles.destructiveTitle]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <Text style={styles.chevron}>›</Text>)}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pressed: {
    backgroundColor: '#f5f5f5',
  },
  textColumn: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
  },
  destructiveTitle: {
    color: '#e53e3e',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: '#ccc',
  },
});
