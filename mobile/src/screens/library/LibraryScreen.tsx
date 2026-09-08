import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../../navigation/types';
import { listMeetings } from '../../services/api/meetings';
import { color, font, space, textMuted } from '../../theme';
import type { Meeting } from '../../types';

type Props = TabScreenProps<'Library'>;

export function LibraryScreen({ navigation }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { meetings: result } = await listMeetings();
    setMeetings(result.filter((m) => m.status === 'ENDED').sort((a, b) => new Date(b.endedAt ?? 0).getTime() - new Date(a.endedAt ?? 0).getTime()));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>Recordings and notes from meetings that have ended.</Text>
      </View>

      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={color.accent} />}
        ListEmptyComponent={<Text style={styles.empty}>No ended meetings yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => navigation.navigate('MeetingDetail', { meetingId: item.id })}>
            <View style={styles.info}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowMeta}>
                {item.endedAt ? new Date(item.endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                {item.recordingStatus === 'READY' ? ' · recording' : ''}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  header: { paddingTop: 8, paddingBottom: 14, paddingHorizontal: space[4] + 4, borderBottomWidth: 2, borderBottomColor: color.divider },
  title: { fontFamily: font.headingBold, fontSize: 26, color: color.text, marginBottom: 4 },
  subtitle: { fontFamily: font.body, fontSize: 13, color: textMuted(0.6) },
  list: { paddingHorizontal: space[4] + 4 },
  empty: { fontFamily: font.body, color: textMuted(0.6), textAlign: 'center', marginTop: 40 },
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: color.divider },
  info: { flex: 1 },
  rowTitle: { fontFamily: font.bodySemiBold, fontSize: 15, color: color.text },
  rowMeta: { fontFamily: font.body, fontSize: 12, color: textMuted(0.55), marginTop: 3 }
});
