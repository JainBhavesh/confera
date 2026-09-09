import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AuthStackParamList } from '../../navigation/types';
import * as authApi from '../../services/api/auth';
import { ApiError } from '../../services/api/client';
import { color, control, font, space, textMuted } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

type Step = 'request' | 'reset' | 'done';

export function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async () => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.requestOtp(email.trim(), 'PASSWORD_RESET');
      setStep('reset');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.forgotPassword.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      setStep('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.forgotPassword.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('auth.forgotPassword.title')}</Text>

          {step === 'request' ? (
            <>
              <Text style={styles.subtitle}>{t('auth.forgotPassword.requestSubtitle')}</Text>

              <Text style={styles.label}>{t('auth.forgotPassword.emailLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.forgotPassword.emailPlaceholder')}
                placeholderTextColor={textMuted(0.45)}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable style={styles.primaryButton} onPress={handleRequest} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={color.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('auth.forgotPassword.requestSubmit')}</Text>
                )}
              </Pressable>
            </>
          ) : step === 'reset' ? (
            <>
              <Text style={styles.subtitle}>{t('auth.forgotPassword.resetSubtitle', { email })}</Text>

              <Text style={styles.label}>{t('auth.forgotPassword.codeLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.forgotPassword.codePlaceholder')}
                placeholderTextColor={textMuted(0.45)}
                keyboardType="number-pad"
                autoCapitalize="none"
                value={code}
                onChangeText={setCode}
              />

              <Text style={styles.label}>{t('auth.forgotPassword.newPasswordLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••••"
                placeholderTextColor={textMuted(0.45)}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable style={styles.primaryButton} onPress={handleReset} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={color.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('auth.forgotPassword.resetSubmit')}</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>{t('auth.forgotPassword.success')}</Text>
              <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.primaryButtonText}>{t('auth.forgotPassword.backToLogin')}</Text>
              </Pressable>
            </>
          )}
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
  primaryButton: { height: control.button, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryButtonText: { fontFamily: font.body, fontSize: 16, fontWeight: '600', color: color.white }
});
