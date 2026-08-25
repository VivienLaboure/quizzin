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
import { loginUser } from '../../API';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import { authErrorStore } from '../../lib/authErrorStore';
import { useAuth } from '../../lib/AuthContext';
import { colors, spacing, typography } from '../../lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Pré-rempli si on arrive ici suite à une déconnexion automatique (token
  // expiré) plutôt que par un clic volontaire — évite de laisser
  // l'utilisateur se demander pourquoi il a été renvoyé sans explication.
  const [error, setError] = useState(() => authErrorStore.consumeExpiredFlag() ? 'Ta session a expiré, reconnecte-toi.' : '');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser({ email: email.trim(), password });
      await login(data.token, data.user);
      router.replace('/screens/home');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>👋</Text>
        <Text style={typography.h1}>Content de te revoir</Text>
        <Text style={[typography.body, styles.subtitle]}>Connecte-toi pour continuer ta progression.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextField
          placeholder="Adresse email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextField
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/screens/forgotPassword')}>
          <Text style={styles.linkText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <Button label="Se connecter" onPress={handleLogin} loading={loading} />

        <View style={styles.row}>
          <Text style={styles.mutedText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => router.replace('/screens/register')}>
            <Text style={styles.linkText}>S&apos;inscrire</Text>
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
  linkButton: { alignSelf: 'flex-end', marginBottom: spacing.md },
  errorText: { color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  row: { flexDirection: 'row', marginTop: spacing.lg, alignItems: 'center' },
  mutedText: { color: colors.textSecondary, fontSize: 14 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
