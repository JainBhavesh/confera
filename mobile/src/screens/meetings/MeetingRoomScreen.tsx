import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  LiveKitRoom,
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks
} from '@livekit/react-native';
import { ConnectionState, Track, type Participant } from 'livekit-client';
import { useTranslation } from 'react-i18next';
import type { AppStackParamList } from '../../navigation/types';
import { joinMeeting, leaveMeeting } from '../../services/api/meetings';
import { useAuth } from '../../hooks/useAuth';
import { ParticipantTile } from '../../components/meeting/ParticipantTile';
import { MeetingChatPanel } from '../../components/meeting/MeetingChatPanel';
import { Icon, type IconName } from '../../components/icons/Icon';
import { callTextMuted, color, control, font } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MeetingRoom'>;

interface ConnectionInfo {
  token: string;
  serverUrl: string;
}

export function MeetingRoomScreen({ route, navigation }: Props) {
  const { meetingId } = route.params;
  const { t } = useTranslation();
  const { user } = useAuth();
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    joinMeeting(meetingId)
      .then(({ token, serverUrl }) => {
        if (!cancelled) {
          if (!serverUrl) {
            setError(t('meetings.room.notConfigured'));
            return;
          }
          setConnectionInfo({ token, serverUrl });
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('meetings.room.joinError'));
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, t]);

  // Best-effort: records a leave even if the screen is dismissed via the
  // hardware/gesture back action rather than the in-room "End" button.
  useEffect(() => {
    return () => {
      leaveMeeting(meetingId).catch(() => {});
    };
  }, [meetingId]);

  // Guards against double-navigation: pressing "End" unmounts LiveKitRoom,
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
          <Text style={styles.leaveButtonText}>{t('meetings.room.goBack')}</Text>
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
      audio
      video
      onDisconnected={handleLeave}
    >
      <MeetingRoomContent meetingId={meetingId} currentUserId={user.id} onLeave={handleLeave} />
    </LiveKitRoom>
  );
}

function useDisplayName() {
  const { t } = useTranslation();
  return (participant: Participant) => participant.name || participant.identity || t('meetings.room.guest');
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
  const { t } = useTranslation();
  const displayName = useDisplayName();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const [chatOpen, setChatOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  if (connectionState !== ConnectionState.Connected) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={color.accent} />
        <Text style={styles.connecting}>{t('meetings.room.connecting')}</Text>
      </View>
    );
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.room} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.liveDot} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('meetings.room.title')}
        </Text>
        <Text style={styles.timer}>
          {mm}:{ss}
        </Text>
      </View>

      {tracks.length > 1 ? (
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
      ) : (
        <View style={styles.singleTileWrapper}>
          {tracks[0] ? <ParticipantTile trackRef={tracks[0]} fullscreen /> : null}
        </View>
      )}

      <View style={styles.controls}>
        <CallControl
          icon="mic"
          label={isMicrophoneEnabled ? t('meetings.room.mute') : t('meetings.room.unmute')}
          active={!isMicrophoneEnabled}
          onPress={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        />
        <CallControl
          icon="camera"
          label={t('meetings.room.camera')}
          active={!isCameraEnabled}
          onPress={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
        />
        <CallControl icon="people" label={t('meetings.room.people')} badge={remoteParticipants.length + 1} onPress={() => setPeopleOpen(true)} />
        <CallControl icon="chat" label={t('meetings.room.chat')} onPress={() => setChatOpen(true)} />
        <CallControl icon="callEnd" label={t('meetings.room.end')} danger onPress={onLeave} />
      </View>

      <Modal visible={peopleOpen} animationType="slide" transparent onRequestClose={() => setPeopleOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPeopleOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('meetings.room.peopleCount', { count: remoteParticipants.length + 1 })}</Text>
            <PersonRow name={t('common.you')} muted={!isMicrophoneEnabled} cameraOff={!isCameraEnabled} />
            {remoteParticipants.map((p) => (
              <PersonRow key={p.identity} name={displayName(p)} muted={!p.isMicrophoneEnabled} cameraOff={!p.isCameraEnabled} />
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={chatOpen} animationType="slide" onRequestClose={() => setChatOpen(false)}>
        <MeetingChatPanel meetingId={meetingId} currentUserId={currentUserId} onClose={() => setChatOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}

function CallControl({
  icon,
  label,
  onPress,
  active,
  danger,
  badge
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.controlColumn}>
      <Pressable
        style={[styles.controlButton, danger && styles.controlButtonDanger]}
        onPress={onPress}
        accessibilityLabel={label}
      >
        <Icon name={icon} size={22} color={active ? color.accent500 : color.callText} strokeWidth={1.8} />
        {badge ? (
          <View style={styles.controlBadge}>
            <Text style={styles.controlBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>
      <Text style={styles.controlLabel}>{label}</Text>
    </View>
  );
}

function PersonRow({ name, muted, cameraOff }: { name: string; muted: boolean; cameraOff: boolean }) {
  return (
    <View style={styles.personRow}>
      <View style={styles.personAvatar}>
        <Text style={styles.personAvatarText}>{name.slice(0, 2).toUpperCase()}</Text>
      </View>
      <Text style={styles.personName}>{name}</Text>
      <View style={styles.personIcons}>
        <Icon name="mic" size={16} color={muted ? color.accent500 : callTextMuted(0.7)} strokeWidth={1.8} />
        <Icon name="camera" size={16} color={cameraOff ? color.accent500 : callTextMuted(0.7)} strokeWidth={1.8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  room: { flex: 1, backgroundColor: color.callBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.callBg, gap: 12, padding: 24 },
  connecting: { fontFamily: font.body, color: callTextMuted(0.7), fontSize: 14 },
  error: { fontFamily: font.body, color: color.accent500, fontSize: 15, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 10 },
  liveDot: { width: 8, height: 8, backgroundColor: color.accent },
  headerTitle: { flex: 1, fontFamily: font.headingBold, fontSize: 15, color: color.callText },
  timer: { fontFamily: font.body, fontSize: 13, color: callTextMuted(0.55), fontVariant: ['tabular-nums'] },
  grid: { padding: 12, flexGrow: 1 },
  gridRow: { gap: 8 },
  tileWrapper: { flex: 1, marginBottom: 8 },
  singleTileWrapper: { flex: 1, padding: 12 },
  controls: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 6 },
  controlColumn: { alignItems: 'center', gap: 6 },
  controlButton: {
    width: control.callControl,
    height: control.callControl,
    backgroundColor: color.callSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center'
  },
  controlButtonDanger: { backgroundColor: color.accent700 },
  controlBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  controlBadgeText: { fontFamily: font.bodySemiBold, fontSize: 10, color: color.white },
  controlLabel: { fontFamily: font.body, fontSize: 10, color: callTextMuted(0.6) },
  leaveButton: { backgroundColor: color.accent, paddingHorizontal: 20, paddingVertical: 10 },
  leaveButtonText: { fontFamily: font.bodySemiBold, color: color.white },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: color.callSurface, padding: 16, paddingBottom: 32, gap: 4 },
  sheetTitle: { fontFamily: font.headingBold, fontSize: 15, color: color.callText, marginBottom: 8 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  personAvatar: { width: 36, height: 36, backgroundColor: color.callSurfaceAlt, alignItems: 'center', justifyContent: 'center' },
  personAvatarText: { fontFamily: font.headingBold, fontSize: 12, color: color.callText },
  personName: { flex: 1, fontFamily: font.body, fontSize: 14, color: color.callText },
  personIcons: { flexDirection: 'row', gap: 10 }
});
