import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Livestream } from '../../types';

const STATUS_COLORS: Record<Livestream['status'], string> = {
  SCHEDULED: '#64748b',
  LIVE: '#22c55e',
  ENDED: '#475569'
};

export function LivestreamListItem({ livestream, onPress }: { livestream: Livestream; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.title}>{livestream.title}</Text>
        <Text style={styles.host}>{livestream.createdBy?.name ?? 'Unknown host'}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: STATUS_COLORS[livestream.status] }]}>
        <Text style={styles.badgeText}>{livestream.status}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10
  },
  info: { flex: 1, marginRight: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  host: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' }
});
