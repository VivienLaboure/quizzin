import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { forgotPassword, resetPassword } from '../../API';
import Button from '../../components/ui/Button';
import ScreenHeader from '../../components/ui/ScreenHeader';
import TextField from '../../components/ui/TextField';
import { colors, spacing, typography } from '../../lib/theme';

type Step = 'email' | 'code';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setError('');
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSuccess('Si cet email est enregistré, vous recevrez un code sous peu.');
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Erreur, veuillez réessayer');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    if (!code.trim() || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      setSuccess('Mot de passe réinitialisé ! Vous pouvez vous connecter.');
      setTimeout(() => router.replace('/screens/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScreenHeader onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.h1}>Mot de passe oublié</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        {step === 'email' && (
          <>
            <Text style={[typography.body, styles.subtitle]}>
              Entrez votre email et nous vous enverrons un code à 6 chiffres.
            </Text>

            <TextField
              placeholder="Adresse email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button label="Envoyer le code" onPress={handleSendCode} loading={loading} />
          </>
        )}

        {step === 'code' && (
          <>
            <Text style={[typography.body, styles.subtitle]}>
              Entrez le code reçu par email ainsi que votre nouveau mot de passe.
            </Text>

            <TextField
              placeholder="Code à 6 chiffres"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              centered
              style={styles.codeInput}
            />

            <TextField
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextField
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Button label="Réinitialiser" onPress={handleResetPassword} loading={loading} />

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => { setStep('email'); setSuccess(''); setError(''); }}
            >
              <Text style={styles.linkText}>Renvoyer un code</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  subtitle: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  codeInput: { fontSize: 22, letterSpacing: 8 },
  errorText: { color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  successText: { color: colors.success, marginBottom: spacing.md, textAlign: 'center' },
  resendButton: { marginTop: spacing.md },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
