import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { getMeeting } from '../../services/api/meetings';
import { getMeetingNotes } from '../../services/api/notes';
import { listActionItems, updateActionItem } from '../../services/api/actionItems';
import { Icon } from '../../components/icons/Icon';
import { color, control, font, space, textMuted } from '../../theme';
import type { ActionItem, Meeting, MeetingNotes } from '../../types';

type Props = NativeStackScreenProps<AppStackParamList, 'MeetingDetail'>;

type Tab = 'summary' | 'actions' | 'transcript';

function formatDuration(startedAt: string | null, endedAt: string | null) {
  if (!startedAt || !endedAt) return null;
  const minutes = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  return `${minutes} min`;
}

export function MeetingDetailScreen({ route, navigation }: Props) {
  const { meetingId } = route.params;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState<MeetingNotes | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [tab, setTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ meeting: m }, { notes: n }, { actionItems: items }] = await Promise.all([
      getMeeting(meetingId),
      getMeetingNotes(meetingId),
      listActionItems({ meetingId })
    ]);
    setMeeting(m);
    setNotes(n);
    setActionItems(items);
  }, [meetingId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const toggleAction = async (item: ActionItem) => {
    const nextStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setActionItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)));
    try {
      await updateActionItem(item.id, { status: nextStatus });
    } catch {
      setActionItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)));
    }
  };

  const handleShare = () => {
    Share.share({
      title: meeting?.title,
      message: `${meeting?.title ?? 'Meeting'}\n\n${notes?.summary ?? 'No summary generated yet.'}`
    }).catch(() => {});
  };

  if (loading || !meeting) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={color.accent} />
      </SafeAreaView>
    );
  }

  const duration = formatDuration(meeting.startedAt, meeting.endedAt);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Icon name="back" size={22} color={color.text} strokeWidth={1.9} />
        </Pressable>
        <Text style={styles.headerLabel}>Meetings</Text>
        <Pressable style={[styles.iconButton, styles.headerRightButton]} onPress={handleShare} accessibilityLabel="Share notes">
          <Icon name="share" size={20} color={color.text} strokeWidth={1.9} />
        </Pressable>
        <Pressable style={styles.iconButton} accessibilityLabel="More">
          <Icon name="moreVertical" size={20} color={color.text} />
        </Pressable>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{meeting.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{meeting.status}</Text>
          </View>
          {meeting.endedAt ? <Text style={styles.metaText}>{new Date(meeting.endedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text> : null}
          {duration ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{duration}</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.tabs}>
        {(['summary', 'actions', 'transcript'] as Tab[]).map((t) => (
          <Pressable key={t} style={[styles.tabButton, tab === t && styles.tabButtonActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'summary' ? 'Summary' : t === 'actions' ? `Actions · ${actionItems.length}` : 'Transcript'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {tab === 'summary' &&
          (meeting.recordingStatus === 'READY' ? (
            <View style={styles.recordingRow}>
              <View style={styles.playButton}>
                <Icon name="play" size={18} color={color.white} />
              </View>
              <View>
                <Text style={styles.recordingTitle}>Audio recording</Text>
                <Text style={styles.recordingSub}>{duration ?? 'Available'} · transcribed</Text>
              </View>
            </View>
          ) : null)}
        {tab === 'summary' && (
          <>
            <Text style={styles.blockHeading}>Summary</Text>
            {notes?.summary ? (
              <Text style={styles.paragraph}>{notes.summary}</Text>
            ) : (
              <Text style={styles.emptyText}>
                {notes?.status === 'PENDING' ? 'Notes are still being generated.' : 'No summary is available for this meeting yet.'}
              </Text>
            )}
          </>
        )}

        {tab === 'actions' &&
          (actionItems.length === 0 ? (
            <Text style={styles.emptyText}>No action items for this meeting.</Text>
          ) : (
            actionItems.map((item) => (
              <Pressable key={item.id} style={styles.actionRow} onPress={() => toggleAction(item)}>
                <View style={[styles.checkbox, item.status === 'COMPLETED' && styles.checkboxDone]}>
                  {item.status === 'COMPLETED' ? <Icon name="check" size={14} color={color.white} /> : null}
                </View>
                <Text style={[styles.actionTitle, item.status === 'COMPLETED' && styles.actionTitleDone]}>{item.title}</Text>
              </Pressable>
            ))
          ))}

        {tab === 'transcript' &&
          (notes?.transcript ? (
            <Text style={styles.paragraph}>{notes.transcript}</Text>
          ) : (
            <Text style={styles.emptyText}>No transcript is available for this meeting yet.</Text>
          ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share notes</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  iconButton: { width: control.touchMin, height: control.touchMin, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontFamily: font.bodySemiBold, fontSize: 14, color: textMuted(0.7) },
  headerRightButton: { marginLeft: 'auto' },
  titleBlock: { paddingHorizontal: space[4] + 4, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: color.divider },
  title: { fontFamily: font.headingBold, fontSize: 24, lineHeight: 28, color: color.text, marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  tag: { backgroundColor: color.neutral100, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontFamily: font.body, fontSize: 11, color: color.neutral800 },
  metaText: { fontFamily: font.body, fontSize: 12, color: textMuted(0.6) },
  metaDot: { fontSize: 12, color: textMuted(0.6) },
  tabs: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: color.divider },
  tabButton: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  tabButtonActive: { borderBottomWidth: 3, borderBottomColor: color.accent },
  tabText: { fontFamily: font.body, fontSize: 13, color: textMuted(0.6) },
  tabTextActive: { fontFamily: font.bodySemiBold, color: color.text },
  content: { flex: 1 },
  contentInner: { padding: space[4] + 4, paddingBottom: space[8] },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.callSurface,
    padding: 14,
    marginBottom: 20
  },
  playButton: { width: control.touchMin, height: control.touchMin, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  recordingTitle: { fontFamily: font.bodySemiBold, fontSize: 13, color: color.callText },
  recordingSub: { fontFamily: font.body, fontSize: 12, color: 'rgba(243,242,242,0.6)', marginTop: 2 },
  blockHeading: { fontFamily: font.headingBold, fontSize: 15, color: color.text, marginBottom: 8 },
  paragraph: { fontFamily: font.body, fontSize: 15, lineHeight: 24, color: color.text },
  emptyText: { fontFamily: font.body, fontSize: 14, color: textMuted(0.6) },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.divider },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: color.neutral400, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { borderWidth: 0, backgroundColor: color.accent },
  actionTitle: { flex: 1, fontFamily: font.bodySemiBold, fontSize: 15, lineHeight: 20, color: color.text },
  actionTitleDone: { textDecorationLine: 'line-through', color: textMuted(0.5) },
  footer: { padding: space[4] + 4, borderTopWidth: 2, borderTopColor: color.divider, backgroundColor: color.bg },
  shareButton: { height: control.button, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  shareButtonText: { fontFamily: font.body, fontSize: 16, fontWeight: '600', color: color.white }
});
