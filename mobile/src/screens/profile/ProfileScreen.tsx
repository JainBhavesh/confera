import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Field label="Name" value={user?.name ?? '—'} />
        <Field label="Email" value={user?.email ?? '—'} />
        <Field label="Role" value={user?.role ?? '—'} />
      </View>

      <Pressable style={styles.logoutButton} onPress={() => logout()}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0f172a' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 20 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, gap: 16 },
  field: { marginBottom: 4 },
  fieldLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { color: '#fff', fontSize: 16, marginTop: 4 },
  logoutButton: { marginTop: 24, backgroundColor: '#7f1d1d', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 15 }
});
