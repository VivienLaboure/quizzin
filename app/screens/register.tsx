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
  View,
} from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { registerUser } from '../../API';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!pseudo.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("L'adresse email doit contenir un @");
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({ pseudo: pseudo.trim(), email: email.trim(), password });
      await login(data.token, data.user);
      router.replace('/screens/home');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
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
        <Text style={styles.title}>Inscription</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Pseudo"
          placeholderTextColor="#999"
          value={pseudo}
          onChangeText={setPseudo}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
        />

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

        <TextInput
          style={styles.input}
          placeholder="Mot de passe (6 caractères min.)"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Créer mon compte</Text>
          }
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.mutedText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.replace('/screens/login')}>
            <Text style={styles.linkText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#222',
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
  row: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  mutedText: { color: '#666', fontSize: 14 },
  linkText: { color: '#FF6347', fontSize: 14, fontWeight: '600' },
});
