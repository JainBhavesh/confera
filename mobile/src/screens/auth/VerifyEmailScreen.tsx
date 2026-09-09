import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import * as authApi from '../../services/api/auth';
import { ApiError } from '../../services/api/client';
import { color, control, font, space, textMuted } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ route }: Props) {
  const { email } = route.params;
  const { t } = useTranslation();
  const { refresh } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.verifyEmail(email, code.trim());
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.verifyEmail.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      await authApi.requestOtp(email, 'EMAIL_VERIFICATION');
      setInfo(t('auth.verifyEmail.resent'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.verifyEmail.genericError'));
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('auth.verifyEmail.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.verifyEmail.subtitle', { email })}</Text>

          <Text style={styles.label}>{t('auth.verifyEmail.codeLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.verifyEmail.codePlaceholder')}
            placeholderTextColor={textMuted(0.45)}
            keyboardType="number-pad"
            autoCapitalize="none"
            value={code}
            onChangeText={setCode}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={color.white} /> : <Text style={styles.primaryButtonText}>{t('auth.verifyEmail.submit')}</Text>}
          </Pressable>

          <Pressable style={styles.footer} onPress={handleResend} disabled={resending}>
            <Text style={styles.link}>{resending ? '…' : t('common.resend')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  scroll: { flexGrow: 1, padding: space[6], justifyContent: 'center' },
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
  info: { fontFamily: font.body, color: textMuted(0.6), marginBottom: 12 },
  primaryButton: { height: control.button, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryButtonText: { fontFamily: font.body, fontSize: 16, fontWeight: '600', color: color.white },
  footer: { marginTop: space[6], alignItems: 'center' },
  link: { fontFamily: font.bodySemiBold, color: color.accent700 }
});
