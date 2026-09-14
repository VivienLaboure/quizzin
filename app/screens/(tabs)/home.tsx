import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getThemes } from '../../../API';
import OnboardingOverlay from '../../../components/OnboardingOverlay';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { getThemeDisplayName } from '../../../lib/getThemeDisplayName';
import { getLevelProgress } from '../../../lib/LevelSystem';
import { useProgress } from '../../../lib/ProgressContext';
import SecureStore from '../../../lib/secureStorage';
import { colors, gradients, radius, spacing } from '../../../lib/theme';

const TUTORIAL_SEEN_KEY = 'has_seen_tutorial';

// Onglet "Accueil" — un vrai tableau de bord (progression, action
// principale) plutôt qu'un menu de boutons empilés menant chacun vers un
// écran séparé : Thèmes est désormais le seul autre onglet (voir
// app/screens/(tabs)/_layout.tsx), donc l'accueil n'a plus besoin de servir
// de point de passage obligé.
const Home: React.FC = () => {
  const router = useRouter();
  const { progress, getThemeDifficulty } = useProgress();
  const [showTutorial, setShowTutorial] = useState(false);
  const [themesTotal, setThemesTotal] = useState<number | null>(null);

  const xpData = getLevelProgress(progress.xp);

  // Tutoriel au tout premier lancement — jamais revu ensuite une fois passé.
  useEffect(() => {
    SecureStore.getItemAsync(TUTORIAL_SEEN_KEY).then(seen => {
      if (!seen) setShowTutorial(true);
    });
  }, []);

  // Nombre total de thèmes existants — sert de dénominateur à la carte
  // "Progression". Seul appel réseau de cet écran (endpoint public, pas de
  // compte à interroger : le reste de la progression est déjà en mémoire
  // localement via useProgress()).
  useEffect(() => {
    getThemes()
      .then((data: unknown) => setThemesTotal((data as string[]).length))
      .catch(() => {});
  }, []);

  // Thème à réviser en priorité : celui, parmi les thèmes déjà joués, où la
  // meilleure série de bonnes réponses est la plus courte — une vraie
  // suggestion plutôt qu'un simple "dernier joué" (pas de date conservée par
  // thème, seulement un record).
  const weakestTheme = useMemo(() => {
    const entries = Object.entries(progress.bestStreak);
    if (entries.length === 0) return null;
    return entries.reduce((worst, entry) => (entry[1] < worst[1] ? entry : worst), entries[0]);
  }, [progress.bestStreak]);

  const dismissTutorial = () => {
    setShowTutorial(false);
    SecureStore.setItemAsync(TUTORIAL_SEEN_KEY, 'true');
  };

  const goToTheme = (theme: string) => {
    router.push({
      pathname: '/screens/quizzPage',
      params: { category: theme, difficulty: String(getThemeDifficulty(theme)) },
    });
  };

  return (
    <View style={styles.container}>
      {showTutorial && <OnboardingOverlay onDone={dismissTutorial} />}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('../../assets/logo_text.png')} style={styles.logo} resizeMode="contain" />

        <Card gradient={gradients.sunset} style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Text style={styles.greeting}>Salut ! 👋</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Niv. {xpData.level}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(xpData.progress * 100)}%` }]} />
          </View>

          <Text style={styles.xpLabel}>{xpData.currentXp} / {xpData.neededXp} XP</Text>
        </Card>

        <Button
          label="Jouer"
          onPress={() => router.push('/screens/themes')}
          style={styles.playButton}
        />

        {!!themesTotal && (
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
                {progress.unlockedThemes.length}/{themesTotal} thèmes débloqués
              </Text>
              <View style={styles.miniTrack}>
                <View
                  style={[
                    styles.miniFill,
                    { width: `${Math.min(100, Math.round((progress.unlockedThemes.length / themesTotal) * 100))}%` },
                  ]}
                />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {progress.unlockTokens > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fullWidth}
            onPress={() => router.push('/screens/themes')}
          >
            <Card gradient={gradients.gold} style={styles.tokenCard}>
              <Text style={styles.tokenEmoji}>🔓</Text>
              <View style={styles.tokenTextGroup}>
                <Text style={styles.tokenTitle}>
                  {progress.unlockTokens} jeton{progress.unlockTokens !== 1 ? 's' : ''} de déblocage disponible{progress.unlockTokens !== 1 ? 's' : ''}
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
            onPress={() => goToTheme(weakestTheme[0])}
          >
            <Card style={styles.reviseCard}>
              <View style={styles.reviseTextGroup}>
                <Text style={styles.reviseLabel}>📈 À améliorer</Text>
                <Text style={styles.reviseTheme}>{getThemeDisplayName(weakestTheme[0])}</Text>
                <Text style={styles.reviseScore}>Record : {weakestTheme[1]} bonne{weakestTheme[1] > 1 ? 's' : ''} réponse{weakestTheme[1] > 1 ? 's' : ''} d&apos;affilée</Text>
              </View>
              <Text style={styles.reviseArrow}>›</Text>
            </Card>
          </TouchableOpacity>
        ) : (
          // Aucun quiz encore joué : on remplace la suggestion (qui n'a pas
          // de sens sans historique) par une invitation claire à se lancer,
          // plutôt que de laisser un vide.
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
});

export default Home;
