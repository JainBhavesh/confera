import { StyleSheet, Text, View } from 'react-native';
import { VideoTrack, isTrackReference, type TrackReferenceOrPlaceholder } from '@livekit/react-native';
import { color, font } from '../../theme';

function displayName(participant: { name?: string; identity?: string }) {
  return participant.name || participant.identity || 'Guest';
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ParticipantTile({
  trackRef,
  fullscreen
}: {
  trackRef: TrackReferenceOrPlaceholder;
  fullscreen?: boolean;
}) {
  const isLocal = trackRef.participant.isLocal;
  const hasVideo = isTrackReference(trackRef);
  const name = isLocal ? 'You' : displayName(trackRef.participant);
  const isSpeaking = trackRef.participant.isSpeaking;

  return (
    <View style={[styles.container, fullscreen ? styles.fullscreen : styles.tile, isSpeaking && styles.speaking]}>
      {hasVideo ? (
        <VideoTrack trackRef={trackRef} style={styles.video} mirror={isLocal} objectFit="cover" />
      ) : (
        <View style={styles.noCamera}>
          <Text style={styles.initials}>{initials(displayName(trackRef.participant))}</Text>
        </View>
      )}
      <View style={styles.label}>
        <Text style={styles.labelText} numberOfLines={1}>
          {name}
          {isSpeaking ? ' · speaking' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: color.callSurface
  },
  tile: { aspectRatio: 4 / 3 },
  fullscreen: { flex: 1 },
  speaking: { borderWidth: 2, borderColor: color.accent },
  video: { flex: 1 },
  noCamera: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: font.headingBold, fontSize: 19, color: color.callText },
  label: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(20, 19, 18, 0.82)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: '85%'
  },
  labelText: { fontFamily: font.body, color: color.callText, fontSize: 11 }
});
