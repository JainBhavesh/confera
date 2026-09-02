import { StyleSheet, Text, View } from 'react-native';
import { VideoTrack, isTrackReference, type TrackReferenceOrPlaceholder } from '@livekit/react-native';

function displayName(participant: { name?: string; identity?: string }) {
  return participant.name || participant.identity || 'Guest';
}

export function ParticipantTile({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const isLocal = trackRef.participant.isLocal;
  const hasVideo = isTrackReference(trackRef);

  return (
    <View style={styles.container}>
      {hasVideo ? (
        <VideoTrack trackRef={trackRef} style={styles.video} mirror={isLocal} objectFit="cover" />
      ) : (
        <View style={styles.noCamera}>
          <Text style={styles.noCameraText}>No camera</Text>
        </View>
      )}
      <View style={styles.label}>
        <Text style={styles.labelText}>{isLocal ? 'You' : displayName(trackRef.participant)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  video: { flex: 1 },
  noCamera: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noCameraText: { color: '#64748b', fontSize: 13 },
  label: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  labelText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' }
});
