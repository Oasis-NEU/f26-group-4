import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

// The 🔔/🔕 next to the Following button on someone else's profile, once you
// follow them. Opens a sheet with two switches for notifications about that
// one person. Unrelated to Settings › Notifications, which covers everything
// else.

type NotifyBellProps = {
  name: string; // the person being followed, e.g. "Kenji"
  notifyPosts: boolean;
  notifyStatus: boolean;
  // Whether this viewer can see any part of this person's travel status at all
  // (via getVisibleStatus). If not, the status switch has nothing to attach to
  // and is hidden rather than shown disabled.
  canSeeStatusUpdates: boolean;
  onChange: (prefs: { notifyPosts: boolean; notifyStatus: boolean }) => void;
};

export function NotifyBell({ name, notifyPosts, notifyStatus, canSeeStatusUpdates, onChange }: NotifyBellProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isOn = notifyPosts || notifyStatus;

  return (
    <>
      <Pressable onPress={() => setSheetOpen(true)} style={styles.bellButton}>
        <Text style={styles.bellIcon}>{isOn ? '🔔' : '🔕'}</Text>
      </Pressable>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Notify me when {name}…</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Posts a new place</Text>
            <Switch
              value={notifyPosts}
              onValueChange={(value) => onChange({ notifyPosts: value, notifyStatus })}
            />
          </View>

          {canSeeStatusUpdates && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Updates their status</Text>
              <Switch
                value={notifyStatus}
                onValueChange={(value) => onChange({ notifyPosts, notifyStatus: value })}
              />
            </View>
          )}

          <Text style={styles.note}>{name} isn&apos;t told you turned this on.</Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  bellIcon: {
    fontSize: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 15,
  },
  note: {
    marginTop: 12,
    fontSize: 12,
    color: '#999',
  },
});
