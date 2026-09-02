import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import * as authApi from '../../services/api/auth';
import { ApiError } from '../../services/api/client';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.register({ name: name.trim(), email: email.trim(), password });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to register. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Only available when your organization allows registration.</Text>

      <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#64748b" value={name} onChangeText={setName} />
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
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
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
