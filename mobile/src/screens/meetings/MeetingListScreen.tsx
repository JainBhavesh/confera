import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MeetingListItem } from '../../components/meeting/MeetingListItem';
import { listMeetings } from '../../services/api/meetings';
import type { TabScreenProps } from '../../navigation/types';
import type { Meeting, MeetingStatus } from '../../types';
import { color, font, space, textMuted } from '../../theme';

type Props = TabScreenProps<'Meetings'>;

type Filter = 'ALL' | 'LIVE' | 'SCHEDULED' | 'ENDED';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'LIVE', label: 'Live' },
  { key: 'SCHEDULED', label: 'Upcoming' },
  { key: 'ENDED', label: 'Ended' }
];

export function MeetingListScreen({ navigation }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const { meetings: result } = await listMeetings();
      setMeetings(result);
    } catch {
      setError('Unable to load meetings.');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'ALL') return meetings;
    return meetings.filter((m) => m.status === (filter as MeetingStatus));
  }, [meetings, filter]);

  const handleOpen = (meeting: Meeting) => {
    if (meeting.status === 'LIVE') {
      navigation.navigate('MeetingRoom', { meetingId: meeting.id });
    } else {
      navigation.navigate('MeetingDetail', { meetingId: meeting.id });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={color.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meetings</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterPillText, filter === f.key && styles.filterPillTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={color.accent} />}
        renderItem={({ item }) => <MeetingListItem meeting={item} onPress={() => handleOpen(item)} />}
        ListEmptyComponent={<Text style={styles.empty}>No meetings in this filter.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  header: { paddingTop: 8, paddingBottom: 14, paddingHorizontal: space[4] + 4, borderBottomWidth: 2, borderBottomColor: color.divider },
  title: { fontFamily: font.headingBold, fontSize: 26, color: color.text, marginBottom: 14 },
  filterRow: { gap: 8 },
  filterPill: { height: 36, paddingHorizontal: 14, borderWidth: 1, borderColor: color.neutral400, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' },
  filterPillActive: { backgroundColor: color.text, borderColor: color.text },
  filterPillText: { fontFamily: font.body, fontSize: 13, color: color.text },
  filterPillTextActive: { fontFamily: font.bodySemiBold, color: color.bg },
  error: { fontFamily: font.body, color: color.accent700, paddingHorizontal: space[4] + 4, paddingTop: 12 },
  list: { paddingHorizontal: space[4] + 4 },
  empty: { fontFamily: font.body, color: textMuted(0.6), textAlign: 'center', marginTop: 40 }
});
