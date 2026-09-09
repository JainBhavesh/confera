import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { TabScreenProps } from '../../navigation/types';
import { createScheduledMeeting, listMeetings, type MeetingRecurrence } from '../../services/api/meetings';
import { color, control, font, space, textMuted } from '../../theme';
import type { Meeting } from '../../types';

type Props = TabScreenProps<'Schedule'>;

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function ScheduleScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const RECURRENCE_OPTIONS: { key: MeetingRecurrence; label: string }[] = [
    { key: 'ONCE', label: t('schedule.recurrenceOnce') },
    { key: 'DAILY', label: t('schedule.recurrenceDaily') },
    { key: 'WEEKLY', label: t('schedule.recurrenceWeekly') },
    { key: 'MONTHLY', label: t('schedule.recurrenceMonthly') }
  ];
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState('10:00');
  const [recurrence, setRecurrence] = useState<MeetingRecurrence>('ONCE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { meetings: result } = await listMeetings();
    setMeetings(result);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const upcoming = useMemo(() => {
    return meetings
      .filter((m) => m.status === 'SCHEDULED' && m.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
  }, [meetings]);

  const handleCreate = async () => {
    setError('');
    const trimmed = title.trim();
    if (!trimmed) {
      setError(t('schedule.titleRequired'));
      return;
    }
    const scheduledAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError(t('schedule.invalidDateTime'));
      return;
    }

    setSubmitting(true);
    try {
      await createScheduledMeeting({ title: trimmed, scheduledAt: scheduledAt.toISOString(), recurrence });
      setTitle('');
      await load();
    } catch {
      setError(t('schedule.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('schedule.title')}</Text>

          <Text style={styles.label}>{t('schedule.titleLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('schedule.titlePlaceholder')}
            placeholderTextColor={textMuted(0.45)}
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <View style={styles.rowField}>
              <Text style={styles.label}>{t('schedule.dateLabel')}</Text>
              <TextInput style={styles.input} placeholder={t('schedule.datePlaceholder')} placeholderTextColor={textMuted(0.45)} value={date} onChangeText={setDate} />
            </View>
            <View style={styles.rowField}>
              <Text style={styles.label}>{t('schedule.timeLabel')}</Text>
              <TextInput style={styles.input} placeholder={t('schedule.timePlaceholder')} placeholderTextColor={textMuted(0.45)} value={time} onChangeText={setTime} />
            </View>
          </View>

          <Text style={styles.label}>{t('schedule.repeats')}</Text>
          <View style={styles.segment}>
            {RECURRENCE_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={[styles.segmentOption, recurrence === option.key && styles.segmentOptionActive]}
                onPress={() => setRecurrence(option.key)}
              >
                <Text style={[styles.segmentText, recurrence === option.key && styles.segmentTextActive]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.submitButton} onPress={handleCreate} disabled={submitting}>
            {submitting ? <ActivityIndicator color={color.white} /> : <Text style={styles.submitButtonText}>{t('schedule.submit')}</Text>}
          </Pressable>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{t('schedule.upcoming')}</Text>
          {loading ? (
            <ActivityIndicator color={color.accent} style={{ marginTop: 16 }} />
          ) : upcoming.length === 0 ? (
            <Text style={styles.emptyText}>{t('schedule.upcomingEmpty')}</Text>
          ) : (
            upcoming.map((meeting) => (
              <Pressable
                key={meeting.id}
                style={styles.upcomingRow}
                onPress={() => navigation.navigate('MeetingDetail', { meetingId: meeting.id })}
              >
                <Text style={styles.upcomingDate}>
                  {new Date(meeting.scheduledAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingTitle} numberOfLines={1}>
                    {meeting.title}
                  </Text>
                  <Text style={styles.upcomingTime}>
                    {new Date(meeting.scheduledAt!).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  scroll: { padding: space[4] + 4, paddingBottom: space[8] },
  title: { fontFamily: font.headingBold, fontSize: 26, color: color.text, marginBottom: 18 },
  label: { fontFamily: font.bodySemiBold, fontSize: 14, color: color.text, marginBottom: 6 },
  input: {
    height: control.input,
    borderWidth: 1,
    borderColor: color.neutral400,
    backgroundColor: color.white,
    paddingHorizontal: space[4],
    fontFamily: font.body,
    fontSize: 16,
    color: color.text,
    marginBottom: 16
  },
  row: { flexDirection: 'row', gap: 12 },
  rowField: { flex: 1 },
  segment: { flexDirection: 'row', borderWidth: 1, borderColor: color.neutral400, marginBottom: 16 },
  segmentOption: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: color.neutral400 },
  segmentOptionActive: { backgroundColor: color.accent },
  segmentText: { fontFamily: font.body, fontSize: 13, color: color.text },
  segmentTextActive: { fontFamily: font.bodySemiBold, color: color.white },
  error: { fontFamily: font.body, color: color.accent700, marginBottom: 12 },
  submitButton: { height: control.button, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { fontFamily: font.body, fontSize: 16, fontWeight: '600', color: color.white },
  divider: { height: 2, backgroundColor: color.divider, marginVertical: space[6] },
  sectionTitle: { fontFamily: font.headingBold, fontSize: 17, color: color.text, marginBottom: 8 },
  emptyText: { fontFamily: font.body, fontSize: 14, color: textMuted(0.6), marginTop: 8 },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.divider },
  upcomingDate: { fontFamily: font.headingBold, fontSize: 13, width: 56, color: color.text },
  upcomingInfo: { flex: 1, minWidth: 0 },
  upcomingTitle: { fontFamily: font.bodySemiBold, fontSize: 15, color: color.text },
  upcomingTime: { fontFamily: font.body, fontSize: 12, color: textMuted(0.55), marginTop: 1 }
});
