import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AuthStackParamList } from '../../navigation/types';
import * as authApi from '../../services/api/auth';
import { ApiError } from '../../services/api/client';
import { color, control, font, space, textMuted } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      // register() only sends an email OTP and does not start a session —
      // VerifyEmailScreen completes the flow with the code.
      await authApi.register({ name: name.trim(), email: trimmedEmail, password });
      navigation.navigate('VerifyEmail', { email: trimmedEmail });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.register.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <Image source={require('../../../assets/logo.png')} style={styles.brandMark} resizeMode="contain" />
            <Text style={styles.brandName}>{t('auth.brand')}</Text>
          </View>

          <Text style={styles.title}>{t('auth.register.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>

          <Text style={styles.label}>{t('auth.register.nameLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.register.namePlaceholder')}
            placeholderTextColor={textMuted(0.45)}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>{t('auth.register.emailLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.register.emailPlaceholder')}
            placeholderTextColor={textMuted(0.45)}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>{t('auth.register.passwordLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••"
            placeholderTextColor={textMuted(0.45)}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={color.white} /> : <Text style={styles.primaryButtonText}>{t('auth.register.submit')}</Text>}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Login')} style={styles.footer}>
            <Text style={styles.footerText}>
              {t('auth.register.haveAccount')}<Text style={styles.link}>{t('auth.register.signIn')}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  scroll: { flexGrow: 1, padding: space[6], justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: space[8] },
  brandMark: { width: 26, height: 26 },
  brandName: { fontFamily: font.headingBold, fontSize: 16, letterSpacing: 0.4, color: color.text },
  title: { fontFamily: font.headingBold, fontSize: 28, color: color.text, marginBottom: 4 },
  subtitle: { fontFamily: font.body, fontSize: 14, color: textMuted(0.62), marginBottom: space[6] },
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
    marginBottom: 18
  },
  error: { fontFamily: font.body, color: color.accent700, marginBottom: 12 },
  primaryButton: { height: control.button, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryButtonText: { fontFamily: font.body, fontSize: 16, fontWeight: '600', color: color.white },
  footer: { marginTop: space[6] },
  footerText: { fontFamily: font.body, fontSize: 14, color: textMuted(0.62), textAlign: 'center' },
  link: { fontFamily: font.bodySemiBold, color: color.accent700 }
});
