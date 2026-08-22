import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import OnboardingOverlay from '../../components/OnboardingOverlay';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../lib/AuthContext';
import { getLevelProgress } from '../../lib/LevelSystem';
import SecureStore from '../../lib/secureStorage';
import { colors, gradients, radius, spacing } from '../../lib/theme';

const TUTORIAL_SEEN_KEY = 'has_seen_tutorial';

const Home: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  const userId = user?.scoreId ?? '';
  const xpData = getLevelProgress(user?.xp ?? 0);

  // Tutoriel au tout premier lancement — jamais revu ensuite une fois passé.
  useEffect(() => {
    SecureStore.getItemAsync(TUTORIAL_SEEN_KEY).then(seen => {
      if (!seen) setShowTutorial(true);
    });
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    SecureStore.setItemAsync(TUTORIAL_SEEN_KEY, 'true');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/screens/login');
  };

  return (
    <View style={styles.container}>
      {showTutorial && <OnboardingOverlay onDone={dismissTutorial} />}

      <Image source={require('../assets/logo_text.png')} style={styles.logo} resizeMode="contain" />

      {user && (
        <Card gradient={gradients.sunset} style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Text style={styles.greeting}>Bonjour, {user.pseudo} !</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Niv. {xpData.level}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(xpData.progress * 100)}%` }]} />
          </View>

          <Text style={styles.xpLabel}>{xpData.currentXp} / {xpData.neededXp} XP</Text>
        </Card>
      )}

      <View style={styles.actions}>
        <Button
          label="Jouer"
          onPress={() => router.push({ pathname: '/screens/themes', params: { userId } })}
        />
        <Button
          label="Amis"
          variant="secondary"
          onPress={() => router.push({ pathname: '/screens/friends' })}
          style={styles.actionSpacing}
        />
        <Button
          label="Statistiques"
          variant="secondary"
          onPress={() => router.push({ pathname: '/screens/stats' })}
          style={styles.actionSpacing}
        />
        <Button
          label="Se déconnecter"
          variant="ghost"
          onPress={handleLogout}
          style={styles.actionSpacing}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: {
    width: '70%',
    height: 120,
    marginBottom: spacing.xl,
  },
  profileCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  greeting: { fontSize: 16, fontWeight: '700', color: colors.textOnColor },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
  },
  levelBadgeText: { color: colors.textOnColor, fontWeight: '700', fontSize: 13 },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.full,
  },
  xpLabel: { fontSize: 13, fontWeight: '500', color: colors.textOnColorMuted },
  actions: { width: '100%' },
  actionSpacing: { marginTop: spacing.sm },
});

export default Home;
