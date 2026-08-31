import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { registerUser } from '../../API';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import { colors, spacing, typography } from '../../lib/theme';

export default function RegisterScreen() {
  const router = useRouter();

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
      await registerUser({ pseudo: pseudo.trim(), email: email.trim(), password });
      router.replace({ pathname: '/screens/verifyEmail', params: { email: email.trim() } });
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🚀</Text>
        <Text style={typography.h1}>Crée ton compte</Text>
        <Text style={[typography.body, styles.subtitle]}>Quelques secondes suffisent pour commencer.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextField
          placeholder="Pseudo"
          value={pseudo}
          onChangeText={setPseudo}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
        />

        <TextField
          placeholder="Adresse email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextField
          placeholder="Mot de passe (6 caractères min.)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextField
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Button label="Créer mon compte" onPress={handleRegister} loading={loading} />

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
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  subtitle: { textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  errorText: { color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  row: { flexDirection: 'row', marginTop: spacing.lg, alignItems: 'center' },
  mutedText: { color: colors.textSecondary, fontSize: 14 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
