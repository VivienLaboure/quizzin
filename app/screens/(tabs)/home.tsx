import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFriends } from '../../../API';
import OnboardingOverlay from '../../../components/OnboardingOverlay';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useAuth } from '../../../lib/AuthContext';
import { getLevelProgress } from '../../../lib/LevelSystem';
import SecureStore from '../../../lib/secureStorage';
import { colors, gradients, radius, spacing } from '../../../lib/theme';

const TUTORIAL_SEEN_KEY = 'has_seen_tutorial';
const MEDAL_COLOR: Record<number, string> = { 0: colors.gold, 1: colors.silver, 2: colors.bronze };

interface FriendEntry {
  id: string;
  pseudo: string;
  xp: number;
  isMe?: boolean;
}

// Onglet "Accueil" — un vrai tableau de bord (profil, action principale,
// aperçu du classement amis) plutôt qu'un menu de boutons empilés menant
// chacun vers un écran séparé : les autres sections (Thèmes, Amis, Profil)
// sont désormais des onglets toujours accessibles en bas de l'écran (voir
// app/screens/(tabs)/_layout.tsx), donc l'accueil n'a plus besoin de servir
// de point de passage obligé.
const Home: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [leaderboardPreview, setLeaderboardPreview] = useState<FriendEntry[]>([]);

  const xpData = getLevelProgress(user?.xp ?? 0);

  // Tutoriel au tout premier lancement — jamais revu ensuite une fois passé.
  useEffect(() => {
    SecureStore.getItemAsync(TUTORIAL_SEEN_KEY).then(seen => {
      if (!seen) setShowTutorial(true);
    });
  }, []);

  // Aperçu léger du classement amis — n'affiche rien si l'appel échoue ou si
  // le joueur n'a pas encore d'amis, plutôt que de bloquer tout l'accueil.
  useEffect(() => {
    getFriends()
      .then((data: unknown) => setLeaderboardPreview((data as FriendEntry[]).slice(0, 3)))
      .catch(() => {});
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    SecureStore.setItemAsync(TUTORIAL_SEEN_KEY, 'true');
  };

  return (
    <View style={styles.container}>
      {showTutorial && <OnboardingOverlay onDone={dismissTutorial} />}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('../../assets/logo_text.png')} style={styles.logo} resizeMode="contain" />

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

        <Button
          label="Jouer"
          onPress={() => router.push('/screens/themes')}
          style={styles.playButton}
        />

        {leaderboardPreview.length > 0 && (
          <Card style={styles.leaderboardCard}>
            <View style={styles.leaderboardHeader}>
              <Text style={styles.leaderboardTitle}>Classement amis</Text>
              <Text style={styles.leaderboardLink} onPress={() => router.push('/screens/friends')}>
                Voir tout
              </Text>
            </View>

            {leaderboardPreview.map((entry, index) => (
              <View key={entry.id} style={styles.leaderboardRow}>
                {MEDAL_COLOR[index] ? (
                  <View style={[styles.medalBadge, { backgroundColor: MEDAL_COLOR[index] }]}>
                    <Text style={styles.medalBadgeText}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</Text>
                  </View>
                ) : (
                  <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                )}
                <Text style={styles.leaderboardName}>{entry.pseudo}{entry.isMe ? ' (toi)' : ''}</Text>
                <Text style={styles.leaderboardXp}>{entry.xp} XP</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  logo: {
    width: '70%',
    height: 120,
    marginBottom: spacing.xl,
  },
  profileCard: {
    width: '100%',
    marginBottom: spacing.lg,
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
  playButton: { width: '100%', marginBottom: spacing.lg },
  leaderboardCard: { width: '100%' },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leaderboardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  leaderboardLink: { fontSize: 13, fontWeight: '600', color: colors.primary },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  medalBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalBadgeText: { fontSize: 13 },
  leaderboardRank: { width: 26, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.textMuted },
  leaderboardName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  leaderboardXp: { fontSize: 13, color: colors.textMuted },
});

export default Home;
