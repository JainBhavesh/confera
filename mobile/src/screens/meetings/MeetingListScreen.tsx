import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingListItem } from '../../components/meeting/MeetingListItem';
import { listMeetings } from '../../services/api/meetings';
import type { AppStackParamList } from '../../navigation/types';
import type { Meeting } from '../../types';

type Props = NativeStackScreenProps<AppStackParamList, 'MeetingList'>;

export function MeetingListScreen({ navigation }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0ea5e9" />}
        renderItem={({ item }) => (
          <MeetingListItem meeting={item} onPress={() => navigation.navigate('MeetingRoom', { meetingId: item.id })} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No meetings yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  list: { padding: 20 },
  error: { color: '#f87171', paddingHorizontal: 20, paddingTop: 12 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40 }
});
