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
import { useAuth } from '../../lib/AuthContext';

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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Vérifie ton email</Text>

        <Text style={styles.subtitle}>
          Un code à 6 chiffres a été envoyé à{'\n'}
          <Text style={styles.emailText}>{safeEmail}</Text>
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {resendSuccess ? (
          <Text style={styles.successText}>Nouveau code envoyé !</Text>
        ) : null}

        <TextInput
          ref={inputRef}
          style={styles.codeInput}
          value={code}
          onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor="#ccc"
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, (loading || code.length !== 6) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading || code.length !== 6}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Confirmer</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resendLoading}
        >
          {resendLoading
            ? <ActivityIndicator color="#FF6347" size="small" />
            : <Text style={styles.resendText}>Renvoyer le code</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.replace('/screens/register')}
        >
          <Text style={styles.linkText}>← Modifier mon email</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  emailText: {
    color: '#FF6347',
    fontWeight: '600',
  },
  codeInput: {
    width: '60%',
    borderWidth: 2,
    borderColor: '#FF6347',
    borderRadius: 14,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 10,
    color: '#222',
    marginBottom: 24,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#FF6347',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  resendButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  resendText: {
    color: '#FF6347',
    fontSize: 14,
    fontWeight: '600',
  },
  backLink: { marginTop: 8 },
  linkText: { color: '#aaa', fontSize: 13 },
  errorText: {
    color: '#e00',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    color: '#4CAF50',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
