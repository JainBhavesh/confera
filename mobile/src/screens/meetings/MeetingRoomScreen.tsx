import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  LiveKitRoom,
  useConnectionState,
  useLocalParticipant,
  useTracks
} from '@livekit/react-native';
import { ConnectionState, Track } from 'livekit-client';
import type { AppStackParamList } from '../../navigation/types';
import { joinMeeting, leaveMeeting } from '../../services/api/meetings';
import { useAuth } from '../../hooks/useAuth';
import { ParticipantTile } from '../../components/meeting/ParticipantTile';
import { MeetingChatPanel } from '../../components/meeting/MeetingChatPanel';

type Props = NativeStackScreenProps<AppStackParamList, 'MeetingRoom'>;

interface ConnectionInfo {
  token: string;
  serverUrl: string;
}

export function MeetingRoomScreen({ route, navigation }: Props) {
  const { meetingId } = route.params;
  const { user } = useAuth();
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    joinMeeting(meetingId)
      .then(({ token, serverUrl }) => {
        if (!cancelled) {
          if (!serverUrl) {
            setError('Meeting server is not configured.');
            return;
          }
          setConnectionInfo({ token, serverUrl });
        }
      })
      .catch(() => {
        if (!cancelled) setError('Unable to join the meeting.');
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  // Best-effort: records a leave even if the screen is dismissed via the
  // hardware/gesture back action rather than the in-room "Leave" button.
  useEffect(() => {
    return () => {
      leaveMeeting(meetingId).catch(() => {});
    };
  }, [meetingId]);

  // Guards against double-navigation: pressing "Leave" unmounts LiveKitRoom,
  // which disconnects the room and fires onDisconnected — which would
  // otherwise call this a second time and pop an extra screen.
  const leftRef = useRef(false);
  const handleLeave = useCallback(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    navigation.goBack();
  }, [navigation]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.leaveButton} onPress={() => navigation.goBack()}>
          <Text style={styles.leaveButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!connectionInfo || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={connectionInfo.serverUrl}
      token={connectionInfo.token}
      connect
      audio
      video
      onDisconnected={handleLeave}
    >
      <MeetingRoomContent meetingId={meetingId} currentUserId={user.id} onLeave={handleLeave} />
    </LiveKitRoom>
  );
}

function MeetingRoomContent({
  meetingId,
  currentUserId,
  onLeave
}: {
  meetingId: string;
  currentUserId: string;
  onLeave: () => void;
}) {
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const [chatOpen, setChatOpen] = useState(false);

  if (connectionState !== ConnectionState.Connected) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" />
        <Text style={styles.connecting}>Connecting to meeting…</Text>
      </View>
    );
  }

  return (
    <View style={styles.room}>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.participant.identity}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <View style={styles.tileWrapper}>
            <ParticipantTile trackRef={item} />
          </View>
        )}
      />

      <View style={styles.controls}>
        <Pressable
          style={[styles.controlButton, !isMicrophoneEnabled && styles.controlButtonOff]}
          onPress={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        >
          <Text style={styles.controlText}>{isMicrophoneEnabled ? 'Mute' : 'Unmute'}</Text>
        </Pressable>
        <Pressable
          style={[styles.controlButton, !isCameraEnabled && styles.controlButtonOff]}
          onPress={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
        >
          <Text style={styles.controlText}>{isCameraEnabled ? 'Stop video' : 'Start video'}</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={() => setChatOpen(true)}>
          <Text style={styles.controlText}>Chat</Text>
        </Pressable>
        <Pressable style={[styles.controlButton, styles.leaveButtonInline]} onPress={onLeave}>
          <Text style={styles.controlText}>Leave</Text>
        </Pressable>
      </View>

      <Modal visible={chatOpen} animationType="slide" onRequestClose={() => setChatOpen(false)}>
        <MeetingChatPanel meetingId={meetingId} currentUserId={currentUserId} onClose={() => setChatOpen(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  room: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', gap: 12, padding: 24 },
  connecting: { color: '#94a3b8', fontSize: 14 },
  error: { color: '#f87171', fontSize: 15, textAlign: 'center' },
  grid: { padding: 12 },
  gridRow: { gap: 12 },
  tileWrapper: { flex: 1, marginBottom: 12 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a'
  },
  controlButton: { backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  controlButtonOff: { backgroundColor: '#7f1d1d' },
  leaveButtonInline: { backgroundColor: '#dc2626' },
  controlText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  leaveButton: { backgroundColor: '#0ea5e9', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  leaveButtonText: { color: '#fff', fontWeight: '700' }
});
