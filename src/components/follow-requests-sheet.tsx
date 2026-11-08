import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';

// The "Follow requests" inbox, opened from the 📥 icon next to ☰ on your own
// profile. Only you ever see this sheet. Each row can be accepted (creates the
// follow, removes the request) or declined (just removes the request).

export type FollowRequestItem = {
  fromId: string;
  name: string;
  username: string;
  photoUrl?: string;
  reason?: string; // e.g. "Followed by Jordan"
};

type FollowRequestsSheetProps = {
  visible: boolean;
  onClose: () => void;
  requests: FollowRequestItem[];
  onAccept: (fromId: string) => void;
  onDecline: (fromId: string) => void;
};

export function FollowRequestsSheet({ visible, onClose, requests, onAccept, onDecline }: FollowRequestsSheetProps) {
  // Tracks rows that were just accepted, so they can show "Now follows you"
  // for a moment instead of disappearing the instant the parent's data updates.
  const [justAcceptedIds, setJustAcceptedIds] = useState<string[]>([]);

  function handleAccept(fromId: string) {
    setJustAcceptedIds((current) => [...current, fromId]);
    onAccept(fromId);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Follow requests</Text>

        {requests.length === 0 ? (
          <Text style={styles.empty}>No follow requests right now.</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.fromId}
            renderItem={({ item }) => {
              const justAccepted = justAcceptedIds.includes(item.fromId);
              return (
                <View style={styles.row}>
                  <Avatar name={item.name} photoUrl={item.photoUrl} size={44} />
                  <View style={styles.rowText}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.username}>@{item.username}</Text>
                    {item.reason && <Text style={styles.reason}>{item.reason}</Text>}
                  </View>

                  {justAccepted ? (
                    <Text style={styles.nowFollows}>Now follows you</Text>
                  ) : (
                    <View style={styles.actions}>
                      <Pressable onPress={() => onDecline(item.fromId)} style={styles.declineButton}>
                        <Text style={styles.declineText}>Decline</Text>
                      </Pressable>
                      <Pressable onPress={() => handleAccept(item.fromId)} style={styles.acceptButton}>
                        <Text style={styles.acceptText}>Accept</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}

        <Text style={styles.note}>
          Requests come in when your account is Friends-only (Settings › Privacy). Only you see this.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  empty: {
    color: 'gray',
    paddingVertical: 24,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
  },
  username: {
    color: 'gray',
    fontSize: 13,
  },
  reason: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  declineButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  declineText: {
    fontSize: 13,
  },
  acceptButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2A9D8F',
  },
  acceptText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  nowFollows: {
    fontSize: 13,
    color: '#2A9D8F',
    fontWeight: '600',
  },
  note: {
    marginTop: 12,
    fontSize: 12,
    color: '#999',
  },
});
