import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Meeting } from '../../types';
import { color, control, font, textMuted } from '../../theme';

function formatMeta(meeting: Meeting): string {
  if (meeting.status === 'LIVE') return 'Live now';
  if (meeting.status === 'SCHEDULED' && meeting.scheduledAt) {
    const d = new Date(meeting.scheduledAt);
    const today = new Date().toDateString() === d.toDateString();
    return `${today ? 'Today' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (meeting.status === 'ENDED' && meeting.endedAt) {
    return new Date(meeting.endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return meeting.status;
}

export function MeetingListItem({ meeting, onPress }: { meeting: Meeting; onPress: () => void }) {
  const tagStyle = meeting.status === 'LIVE' ? styles.tagAccent : meeting.status === 'SCHEDULED' ? styles.tagOutline : styles.tagNeutral;
  const tagTextStyle = meeting.status === 'LIVE' ? styles.tagAccentText : meeting.status === 'SCHEDULED' ? styles.tagOutlineText : styles.tagNeutralText;

  return (
    <View style={styles.row}>
      <View style={styles.metaRow}>
        <View style={[styles.tag, tagStyle]}>
          <Text style={[styles.tagText, tagTextStyle]}>{meeting.status}</Text>
        </View>
        <Text style={styles.meta}>{formatMeta(meeting)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {meeting.title}
      </Text>
      <Text style={styles.host} numberOfLines={1}>
        {meeting.createdBy?.name ?? 'Unknown host'}
      </Text>
      {meeting.status === 'LIVE' ? (
        <Pressable style={styles.joinButton} onPress={onPress}>
          <Text style={styles.joinButtonText}>Join now</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.rowTouch} onPress={onPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: color.divider
  },
  rowTouch: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontFamily: font.body, fontSize: 11, letterSpacing: 0.4 },
  tagAccent: { backgroundColor: color.accent100 },
  tagAccentText: { color: color.accent800 },
  tagOutline: { borderWidth: 1, borderColor: color.accent },
  tagOutlineText: { color: color.accent },
  tagNeutral: { backgroundColor: color.neutral100 },
  tagNeutralText: { color: color.neutral800 },
  meta: { fontFamily: font.body, fontSize: 12, color: textMuted(0.55) },
  title: { fontFamily: font.bodySemiBold, fontSize: 16, color: color.text, marginBottom: 2 },
  host: { fontFamily: font.body, fontSize: 13, color: textMuted(0.6) },
  joinButton: {
    marginTop: 12,
    height: control.touchMin,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  joinButtonText: { fontFamily: font.body, fontSize: 15, fontWeight: '600', color: color.white }
});
