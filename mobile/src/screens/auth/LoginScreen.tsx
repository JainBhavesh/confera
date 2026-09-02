import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { ApiError } from '../../services/api/client';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confera</Text>
      <Text style={styles.subtitle}>Sign in to your organization</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#64748b"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don&apos;t have an account? Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f172a' },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#94a3b8', marginBottom: 32 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    marginBottom: 12
  },
  error: { color: '#f87171', marginBottom: 12 },
  button: { backgroundColor: '#0ea5e9', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#38bdf8', textAlign: 'center', marginTop: 20 }
});
