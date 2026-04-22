import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { forgotPassword, resetPassword } from '../../API';

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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mot de passe oublié</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        {step === 'email' && (
          <>
            <Text style={styles.subtitle}>
              Entrez votre email et nous vous enverrons un code à 6 chiffres.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Envoyer le code</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {step === 'code' && (
          <>
            <Text style={styles.subtitle}>
              Entrez le code reçu par email ainsi que votre nouveau mot de passe.
            </Text>

            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="Code à 6 chiffres"
              placeholderTextColor="#999"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TextInput
              style={styles.input}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Réinitialiser</Text>
              }
            </TouchableOpacity>

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
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 14,
    backgroundColor: '#fafafa',
    color: '#222',
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF6347',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e00',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    color: '#2a9d4e',
    marginBottom: 12,
    textAlign: 'center',
  },
  backButton: { alignSelf: 'flex-start', marginBottom: 24 },
  backText: { color: '#FF6347', fontSize: 16, fontWeight: '600' },
  resendButton: { marginTop: 16 },
  linkText: { color: '#FF6347', fontSize: 14, fontWeight: '600' },
});
