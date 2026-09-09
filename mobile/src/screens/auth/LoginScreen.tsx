import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { ApiError } from '../../services/api/client';
import { Icon, GoogleIcon } from '../../components/icons/Icon';
import { color, control, font, space, textMuted } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.login.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.brandRow}>
              <Image source={require('../../../assets/logo.png')} style={styles.brandMark} resizeMode="contain" />
              <Text style={styles.brandName}>{t('auth.brand')}</Text>
            </View>
            <View style={styles.brandUnderline} />
            <Text style={styles.headline}>{t('auth.login.headline')}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{t('auth.login.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

            <Text style={styles.label}>{t('auth.login.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.login.emailPlaceholder')}
              placeholderTextColor={textMuted(0.45)}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>{t('auth.login.passwordLabel')}</Text>
            <View style={[styles.passwordField, passwordFocused && styles.passwordFieldFocused]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••••"
                placeholderTextColor={textMuted(0.45)}
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setPasswordVisible((v) => !v)}
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                hitSlop={8}
              >
                <Icon name="eye" size={20} color={textMuted(0.65)} strokeWidth={1.8} />
              </Pressable>
            </View>

            <Pressable style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>{t('auth.login.forgotPassword')}</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={color.white} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('auth.login.submit')}</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.login.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* TODO: wire once mobile has an OAuth browser-redirect flow (web's
                /api/auth/oauth/google requires a WebBrowser session, not a bare fetch). */}
            <Pressable style={styles.secondaryButton} disabled>
              <GoogleIcon size={20} />
              <Text style={styles.secondaryButtonText}>{t('auth.login.continueWithGoogle')}</Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t('auth.login.noAccount')}
                <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
                  {t('auth.login.register')}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  hero: {
    backgroundColor: color.callSurface,
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: space[6]
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 26, height: 26 },
  brandName: { fontFamily: font.headingBold, fontSize: 16, letterSpacing: 0.4, color: color.callText },
  brandUnderline: { height: 2, width: 72, backgroundColor: color.accent, marginTop: 26, marginBottom: 18 },
  headline: { fontFamily: font.headingBold, fontSize: 30, lineHeight: 33, color: color.callText },
  body: { flex: 1, paddingHorizontal: space[6], paddingTop: 28, paddingBottom: space[6] },
  title: { fontFamily: font.headingBold, fontSize: 24, color: color.text, marginBottom: 4 },
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
  passwordField: {
    height: control.input,
    borderWidth: 1,
    borderColor: color.neutral400,
    backgroundColor: color.white,
    paddingLeft: space[4],
    paddingRight: space[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  passwordFieldFocused: { borderWidth: 2, borderColor: color.accent },
  passwordInput: { flex: 1, fontFamily: font.body, fontSize: 16, color: color.text, letterSpacing: 2 },
  eyeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  forgotLink: { marginBottom: space[6] },
  link: { fontFamily: font.bodySemiBold, fontSize: 14, color: color.accent700 },
  error: { fontFamily: font.body, color: color.accent700, marginBottom: 12 },
  primaryButton: {
    height: control.button,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: { fontFamily: font.body, fontSize: 16, fontWeight: '600', color: color.white },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: space[6] },
  dividerLine: { height: 1, flex: 1, backgroundColor: color.divider },
  dividerText: {
    fontFamily: font.body,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: textMuted(0.55)
  },
  secondaryButton: {
    height: control.button,
    borderWidth: 1,
    borderColor: color.neutral400,
    backgroundColor: color.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  secondaryButtonText: { fontFamily: font.bodySemiBold, fontSize: 16, color: color.text },
  footer: { marginTop: 'auto', paddingTop: space[6] },
  footerText: { fontFamily: font.body, fontSize: 14, color: textMuted(0.62) }
});
