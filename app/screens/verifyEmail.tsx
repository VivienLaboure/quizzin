import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { registerUser, verifyEmailCode } from '../../API';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/AuthContext';
import { colors, radius, spacing, typography } from '../../lib/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { email } = useLocalSearchParams();
  const safeEmail = Array.isArray(email) ? email[0] : String(email ?? '');

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    setError('');
    if (code.trim().length !== 6 || !/^\d{6}$/.test(code.trim())) {
      setError('Le code doit être composé de 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyEmailCode({ email: safeEmail, code: code.trim() });
      await login(data.token, data.user);
      router.replace('/screens/home');
    } catch (err: any) {
      setError(err.message || 'Code incorrect ou expiré');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendSuccess(false);
    setError('');
    setResendLoading(true);
    try {
      // Réutilise le endpoint register avec les mêmes infos — renvoie un nouveau code
      // (le backend met à jour le code si le compte n'est pas encore vérifié)
      await registerUser({ pseudo: '', email: safeEmail, password: '' });
    } catch {
      // Même en cas d'erreur on affiche "envoyé" pour ne pas exposer si l'email existe
    } finally {
      setResendLoading(false);
      setResendSuccess(true);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <Text style={styles.emoji}>📬</Text>
        <Text style={typography.h1}>Vérifie ton email</Text>

        <Text style={styles.subtitle}>
          Un code à 6 chiffres a été envoyé à{'\n'}
          <Text style={styles.emailText}>{safeEmail}</Text>
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {resendSuccess ? <Text style={styles.successText}>Nouveau code envoyé !</Text> : null}

        <TextInput
          ref={inputRef}
          style={styles.codeInput}
          value={code}
          onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor={colors.border}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          autoFocus
        />

        <Button
          label="Confirmer"
          onPress={handleVerify}
          loading={loading}
          disabled={code.length !== 6}
          style={styles.confirmButton}
        />

        <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resendLoading}>
          {resendLoading
            ? <ActivityIndicator color={colors.primary} size="small" />
            : <Text style={styles.resendText}>Renvoyer le code</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/screens/register')}>
          <Text style={styles.linkText}>← Modifier mon email</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  emailText: { color: colors.primary, fontWeight: '600' },
  codeInput: {
    width: '65%',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 10,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  confirmButton: { marginBottom: spacing.md },
  resendButton: { paddingVertical: spacing.sm, marginBottom: spacing.sm },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  backLink: { marginTop: spacing.sm },
  linkText: { color: colors.textMuted, fontSize: 13 },
  errorText: { color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  successText: { color: colors.success, marginBottom: spacing.md, textAlign: 'center', fontWeight: '600' },
});
