import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getFriends, getProfile, getThemes } from '../../../API';
import OnboardingOverlay from '../../../components/OnboardingOverlay';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useAuth } from '../../../lib/AuthContext';
import { getThemeDisplayName } from '../../../lib/getThemeDisplayName';
import { getDifficultyForLevel, getLevel, getLevelProgress } from '../../../lib/LevelSystem';
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

interface ThemeScore {
  theme: string;
  highScore: number;
  totalQuestions: number;
}

interface ProfileData {
  unlockTokens: number;
  scores: ThemeScore[];
  themeXp: Record<string, number>;
  unlockedThemes: string[];
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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [themesTotal, setThemesTotal] = useState<number | null>(null);

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

  // Jetons de déblocage + scores par thème — servent aux cartes "jetons
  // disponibles" et "à améliorer" ci-dessous. Silencieux en cas d'échec,
  // comme pour le classement : un accueil incomplet vaut mieux qu'un accueil
  // cassé.
  useEffect(() => {
    if (!user?.scoreId) return;
    getProfile(user.scoreId)
      .then((data: unknown) => setProfile(data as ProfileData))
      .catch(() => {});
  }, [user?.scoreId]);

  // Nombre total de thèmes existants — sert de dénominateur à la carte
  // "Progression". Endpoint public, pas besoin d'attendre l'utilisateur.
  useEffect(() => {
    getThemes()
      .then((data: unknown) => setThemesTotal((data as string[]).length))
      .catch(() => {});
  }, []);

  // Thème à réviser en priorité : celui, parmi les thèmes déjà joués, où le
  // ratio de bonnes réponses est le plus faible — une vraie suggestion
  // plutôt qu'un simple "dernier joué" (le schéma ne garde pas de date par
  // thème, seulement un score cumulé).
  const weakestTheme = useMemo(() => {
    if (!profile?.scores?.length) return null;
    return profile.scores.reduce((worst, entry) => {
      const ratio = entry.highScore / entry.totalQuestions;
      const worstRatio = worst.highScore / worst.totalQuestions;
      return ratio < worstRatio ? entry : worst;
    }, profile.scores[0]);
  }, [profile]);

  const dismissTutorial = () => {
    setShowTutorial(false);
    SecureStore.setItemAsync(TUTORIAL_SEEN_KEY, 'true');
  };

  const goToTheme = (theme: string) => {
    const level = getLevel(profile?.themeXp?.[theme] ?? 0);
    router.push({
      pathname: '/screens/quizzPage',
      params: { category: theme, difficulty: String(getDifficultyForLevel(level)), userId: user?.scoreId },
    });
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

        {!!profile && !!themesTotal && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fullWidth}
            onPress={() => router.push('/screens/themes')}
          >
            <Card style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <Text style={styles.reviseLabel}>🗺️ Progression</Text>
                <Text style={styles.smallArrow}>›</Text>
              </View>
              <Text style={styles.reviseTheme}>
                {profile.unlockedThemes.length}/{themesTotal} thèmes débloqués
              </Text>
              <View style={styles.miniTrack}>
                <View
                  style={[
                    styles.miniFill,
                    { width: `${Math.min(100, Math.round((profile.unlockedThemes.length / themesTotal) * 100))}%` },
                  ]}
                />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {!!profile && profile.unlockTokens > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fullWidth}
            onPress={() => router.push('/screens/themes')}
          >
            <Card gradient={gradients.gold} style={styles.tokenCard}>
              <Text style={styles.tokenEmoji}>🔓</Text>
              <View style={styles.tokenTextGroup}>
                <Text style={styles.tokenTitle}>
                  {profile.unlockTokens} jeton{profile.unlockTokens !== 1 ? 's' : ''} de déblocage disponible{profile.unlockTokens !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.tokenSubtitle}>Débloque un nouveau thème →</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {weakestTheme ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fullWidth}
            onPress={() => goToTheme(weakestTheme.theme)}
          >
            <Card style={styles.reviseCard}>
              <View style={styles.reviseTextGroup}>
                <Text style={styles.reviseLabel}>📈 À améliorer</Text>
                <Text style={styles.reviseTheme}>{getThemeDisplayName(weakestTheme.theme)}</Text>
                <Text style={styles.reviseScore}>
                  Meilleur score : {weakestTheme.highScore}/{weakestTheme.totalQuestions}
                </Text>
              </View>
              <Text style={styles.reviseArrow}>›</Text>
            </Card>
          </TouchableOpacity>
        ) : !!profile && profile.scores.length === 0 && (
          // Compte tout neuf, aucun quiz encore joué : on remplace la
          // suggestion (qui n'a pas de sens sans historique) par une
          // invitation claire à se lancer, plutôt que de laisser un vide.
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fullWidth}
            onPress={() => router.push('/screens/themes')}
          >
            <Card style={styles.reviseCard}>
              <View style={styles.reviseTextGroup}>
                <Text style={styles.reviseLabel}>🎯 Premier quiz</Text>
                <Text style={styles.reviseTheme}>Prêt à commencer ?</Text>
                <Text style={styles.reviseScore}>Gagne de l&apos;XP et débloque de nouveaux thèmes</Text>
              </View>
              <Text style={styles.reviseArrow}>›</Text>
            </Card>
          </TouchableOpacity>
        )}

        {leaderboardPreview.length > 1 ? (
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
        ) : (
          // Un classement d'une seule personne (soi-même) n'apporte rien —
          // une invitation à ajouter des amis est plus utile que ce cas
          // qui, avant, laissait l'accueil se terminer sur un grand vide.
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fullWidth}
            onPress={() => router.push('/screens/friends')}
          >
            <Card style={styles.reviseCard}>
              <View style={styles.reviseTextGroup}>
                <Text style={styles.reviseLabel}>👥 Amis</Text>
                <Text style={styles.reviseTheme}>Défie tes amis</Text>
                <Text style={styles.reviseScore}>Ajoute des amis pour comparer vos scores</Text>
              </View>
              <Text style={styles.reviseArrow}>›</Text>
            </Card>
          </TouchableOpacity>
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
  fullWidth: { width: '100%' },
  progressCard: { marginBottom: spacing.lg },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  smallArrow: { fontSize: 18, color: colors.textMuted, fontWeight: '700' },
  miniTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  miniFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: radius.full },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  tokenEmoji: { fontSize: 26 },
  tokenTextGroup: { flex: 1 },
  tokenTitle: { fontSize: 15, fontWeight: '700', color: colors.textOnColor },
  tokenSubtitle: { fontSize: 12.5, color: colors.textOnColorMuted, marginTop: 2 },
  reviseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  reviseTextGroup: { flex: 1 },
  reviseLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted, marginBottom: 2 },
  reviseTheme: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  reviseScore: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  reviseArrow: { fontSize: 28, color: colors.textMuted, fontWeight: '700' },
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
