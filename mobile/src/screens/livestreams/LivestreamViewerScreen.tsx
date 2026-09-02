import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveKitRoom, useConnectionState, useRemoteParticipants, useTracks } from '@livekit/react-native';
import { ConnectionState, Track } from 'livekit-client';
import type { AppStackParamList } from '../../navigation/types';
import { joinLivestream } from '../../services/api/livestreams';
import { useAuth } from '../../hooks/useAuth';
import { ParticipantTile } from '../../components/meeting/ParticipantTile';
import { ViewerCountBadge } from '../../components/livestream/ViewerCountBadge';
import { LivestreamChatPanel } from '../../components/livestream/LivestreamChatPanel';

type Props = NativeStackScreenProps<AppStackParamList, 'LivestreamViewer'>;

interface ConnectionInfo {
  token: string;
  serverUrl: string;
}

export function LivestreamViewerScreen({ route, navigation }: Props) {
  const { livestreamId } = route.params;
  const { user } = useAuth();
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    joinLivestream(livestreamId)
      .then(({ token, serverUrl }) => {
        if (!cancelled) {
          if (!serverUrl) {
            setError('Livestream server is not configured.');
            return;
          }
          setConnectionInfo({ token, serverUrl });
        }
      })
      .catch(() => {
        if (!cancelled) setError('This livestream is not live right now.');
      });

    return () => {
      cancelled = true;
    };
  }, [livestreamId]);

  const handleLeave = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.leaveButton} onPress={handleLeave}>
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
      audio={false}
      video={false}
      onDisconnected={handleLeave}
    >
      <LivestreamViewerContent livestreamId={livestreamId} currentUserId={user.id} onLeave={handleLeave} />
    </LiveKitRoom>
  );
}

function LivestreamViewerContent({
  livestreamId,
  currentUserId,
  onLeave
}: {
  livestreamId: string;
  currentUserId: string;
  onLeave: () => void;
}) {
  const connectionState = useConnectionState();
  const remoteParticipants = useRemoteParticipants();
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const hostTrack = cameraTracks[0];
  const [chatOpen, setChatOpen] = useState(false);

  if (connectionState !== ConnectionState.Connected) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" />
        <Text style={styles.connecting}>Connecting…</Text>
      </View>
    );
  }

  return (
    <View style={styles.room}>
      <View style={styles.stage}>
        {hostTrack ? (
          <ParticipantTile trackRef={hostTrack} />
        ) : (
          <View style={styles.waiting}>
            <Text style={styles.waitingText}>Waiting for the host to go live…</Text>
          </View>
        )}
        <View style={styles.badgeWrapper}>
          <ViewerCountBadge count={Math.max(remoteParticipants.length, 0)} />
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={() => setChatOpen(true)}>
          <Text style={styles.controlText}>Chat</Text>
        </Pressable>
        <Pressable style={[styles.controlButton, styles.leaveButtonInline]} onPress={onLeave}>
          <Text style={styles.controlText}>Leave</Text>
        </Pressable>
      </View>

      <Modal visible={chatOpen} animationType="slide" onRequestClose={() => setChatOpen(false)}>
        <LivestreamChatPanel livestreamId={livestreamId} currentUserId={currentUserId} onClose={() => setChatOpen(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  room: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', gap: 12, padding: 24 },
  connecting: { color: '#94a3b8', fontSize: 14 },
  error: { color: '#f87171', fontSize: 15, textAlign: 'center' },
  stage: { flex: 1 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  waitingText: { color: '#64748b', fontSize: 14 },
  badgeWrapper: { position: 'absolute', right: 16, top: 16 },
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
  leaveButtonInline: { backgroundColor: '#dc2626' },
  controlText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  leaveButton: { backgroundColor: '#0ea5e9', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  leaveButtonText: { color: '#fff', fontWeight: '700' }
});
