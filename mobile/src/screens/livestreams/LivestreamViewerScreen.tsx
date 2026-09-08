import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveKitRoom, useConnectionState, useRemoteParticipants, useTracks } from '@livekit/react-native';
import { ConnectionState, Track } from 'livekit-client';
import type { AppStackParamList } from '../../navigation/types';
import { joinLivestream } from '../../services/api/livestreams';
import { useAuth } from '../../hooks/useAuth';
import { ParticipantTile } from '../../components/meeting/ParticipantTile';
import { ViewerCountBadge } from '../../components/livestream/ViewerCountBadge';
import { LivestreamChatPanel } from '../../components/livestream/LivestreamChatPanel';
import { Icon } from '../../components/icons/Icon';
import { callTextMuted, color, control, font } from '../../theme';

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
        <ActivityIndicator color={color.accent} />
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
        <ActivityIndicator color={color.accent} />
        <Text style={styles.connecting}>Connecting…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.room} edges={['top', 'bottom']}>
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
        <View style={styles.controlColumn}>
          <Pressable style={styles.controlButton} onPress={() => setChatOpen(true)} accessibilityLabel="Chat">
            <Icon name="moreHorizontal" size={20} color={color.callText} />
          </Pressable>
          <Text style={styles.controlLabel}>Chat</Text>
        </View>
        <View style={styles.controlColumn}>
          <Pressable style={[styles.controlButton, styles.controlButtonDanger]} onPress={onLeave} accessibilityLabel="Leave">
            <Icon name="callEnd" size={20} color={color.callText} strokeWidth={1.8} />
          </Pressable>
          <Text style={styles.controlLabel}>Leave</Text>
        </View>
      </View>

      <Modal visible={chatOpen} animationType="slide" onRequestClose={() => setChatOpen(false)}>
        <LivestreamChatPanel livestreamId={livestreamId} currentUserId={currentUserId} onClose={() => setChatOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  room: { flex: 1, backgroundColor: color.callBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.callBg, gap: 12, padding: 24 },
  connecting: { fontFamily: font.body, color: callTextMuted(0.7), fontSize: 14 },
  error: { fontFamily: font.body, color: color.accent500, fontSize: 15, textAlign: 'center' },
  stage: { flex: 1 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  waitingText: { fontFamily: font.body, color: callTextMuted(0.6), fontSize: 14 },
  badgeWrapper: { position: 'absolute', right: 16, top: 16 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 24,
    paddingVertical: 14
  },
  controlColumn: { alignItems: 'center', gap: 6 },
  controlButton: { width: control.callControl, height: control.callControl, backgroundColor: color.callSurfaceAlt, alignItems: 'center', justifyContent: 'center' },
  controlButtonDanger: { backgroundColor: color.accent700 },
  controlLabel: { fontFamily: font.body, fontSize: 10, color: callTextMuted(0.6) },
  leaveButton: { backgroundColor: color.accent, paddingHorizontal: 20, paddingVertical: 10 },
  leaveButtonText: { fontFamily: font.bodySemiBold, color: color.white }
});
