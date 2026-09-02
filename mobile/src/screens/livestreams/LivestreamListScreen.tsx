import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LivestreamListItem } from '../../components/livestream/LivestreamListItem';
import { listLivestreams } from '../../services/api/livestreams';
import type { AppStackParamList } from '../../navigation/types';
import type { Livestream } from '../../types';

type Props = NativeStackScreenProps<AppStackParamList, 'LivestreamList'>;

export function LivestreamListScreen({ navigation }: Props) {
  const [livestreams, setLivestreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const { livestreams: result } = await listLivestreams();
      setLivestreams(result);
    } catch {
      setError('Unable to load livestreams.');
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
        data={livestreams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0ea5e9" />}
        renderItem={({ item }) => (
          <LivestreamListItem
            livestream={item}
            onPress={() => navigation.navigate('LivestreamViewer', { livestreamId: item.id })}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No livestreams yet.</Text>}
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
