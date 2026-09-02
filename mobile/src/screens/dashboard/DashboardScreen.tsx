import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome{user ? `, ${user.name}` : ''}</Text>

      <Pressable style={styles.card} onPress={() => navigation.navigate('MeetingList')}>
        <Text style={styles.cardTitle}>Meetings</Text>
        <Text style={styles.cardSubtitle}>Join or view your meetings</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('LivestreamList')}>
        <Text style={styles.cardTitle}>Livestreams</Text>
        <Text style={styles.cardSubtitle}>Watch live broadcasts</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.cardSubtitle}>Manage your account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0f172a', gap: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  cardSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 }
});
