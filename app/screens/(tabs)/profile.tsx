import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getProfile, getThemes } from '../../../API';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { useAuth } from '../../../lib/AuthContext';
import { GetDifficultyName } from '../../../lib/GetDifficultyName';
import { getThemeDisplayName } from '../../../lib/getThemeDisplayName';
import { getDifficultyForLevel, getLevelProgress } from '../../../lib/LevelSystem';
import { colors, difficultyColors, gradients, radius, spacing, typography } from '../../../lib/theme';

const DIFFICULTY_COLOR = difficultyColors;

// Onglet "Profil" — fusionne les anciennes stats et le bouton de déconnexion
// (auparavant sur des écrans séparés, atteints depuis un menu sur l'accueil).
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [themesList, setThemesList] = useState<string[]>([]);
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>([]);
  const [unlockTokens, setUnlockTokens] = useState(0);
  const [themeXp, setThemeXp] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [names, profile] = await Promise.all([
          getThemes() as Promise<string[]>,
          user?.scoreId ? getProfile(user.scoreId) : Promise.resolve(null),
        ]);
        setThemesList(names);
        if (profile) {
          setUnlockedThemes(profile.unlockedThemes ?? []);
          setUnlockTokens(profile.unlockTokens ?? 0);
          setThemeXp(profile.themeXp ?? {});
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques :', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.scoreId]);

  const handleLogout = async () => {
    await logout();
    router.replace('/screens/login');
  };

  const globalProgress = getLevelProgress(user?.xp ?? 0);

  const unlockedSorted = [...unlockedThemes].sort(
    (a, b) => (themeXp[b] ?? 0) - (themeXp[a] ?? 0)
  );
  const lockedThemes = themesList.filter(t => !unlockedThemes.includes(t));

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profil" />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Identité */}
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.pseudo ?? '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pseudo}>{user?.pseudo}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>

          {/* Vue d'ensemble */}
          <Card gradient={gradients.ocean} style={styles.card}>
            <Text style={styles.sectionTitle}>Vue d&apos;ensemble</Text>

            <View style={styles.globalRow}>
              <View style={styles.globalStat}>
                <Text style={styles.globalValue}>{globalProgress.level}</Text>
                <Text style={styles.globalLabel}>Niveau</Text>
              </View>
              <View style={styles.globalStat}>
                <Text style={styles.globalValue}>{user?.xp ?? 0}</Text>
                <Text style={styles.globalLabel}>XP totale</Text>
              </View>
              <View style={styles.globalStat}>
                <Text style={styles.globalValue}>{unlockTokens}</Text>
                <Text style={styles.globalLabel}>Jeton{unlockTokens !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.globalStat}>
                <Text style={styles.globalValue}>{unlockedThemes.length}/{themesList.length}</Text>
                <Text style={styles.globalLabel}>Thèmes</Text>
              </View>
            </View>

            <View style={styles.globalProgressTrack}>
              <View style={[styles.globalProgressFill, { width: `${Math.round(globalProgress.progress * 100)}%` }]} />
            </View>
            <Text style={styles.globalProgressLabel}>
              {globalProgress.currentXp} / {globalProgress.neededXp} XP avant le niveau {globalProgress.level + 1}
            </Text>
          </Card>

          {/* Progression par thème */}
          <Text style={styles.sectionTitleOutside}>Progression par thème</Text>

          {unlockedSorted.map(theme => {
            const xp = themeXp[theme] ?? 0;
            const progress = getLevelProgress(xp);
            const difficulty = getDifficultyForLevel(progress.level);
            const difficultyColor = DIFFICULTY_COLOR[difficulty];
            return (
              <Card key={theme} style={[styles.themeCard, { borderLeftWidth: 4, borderLeftColor: difficultyColor }]}>
                <View style={styles.themeHeader}>
                  <Text style={styles.themeName}>{getThemeDisplayName(theme)}</Text>
                  <View style={styles.themeLevelBadge}>
                    <Text style={styles.themeLevelText}>Niv. {progress.level}</Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round(progress.progress * 100)}%`, backgroundColor: difficultyColor }]} />
                </View>

                <View style={styles.themeFooter}>
                  <View style={styles.difficultyRow}>
                    <View style={[styles.dot, { backgroundColor: difficultyColor }]} />
                    <Text style={styles.mutedText}>{GetDifficultyName(difficulty)}</Text>
                  </View>
                  <Text style={styles.mutedText}>{xp} XP</Text>
                </View>
              </Card>
            );
          })}

          {lockedThemes.length > 0 && (
            <Card style={styles.lockedCard}>
              {lockedThemes.map(theme => (
                <View key={theme} style={styles.lockedRow}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={styles.lockedText}>{getThemeDisplayName(theme)}</Text>
                </View>
              ))}
            </Card>
          )}

          <Button
            label="Se déconnecter"
            variant="ghost"
            onPress={handleLogout}
            style={styles.logoutButton}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.secondaryDark, fontSize: 22, fontWeight: '800' },
  pseudo: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  card: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.textOnColor, marginBottom: spacing.md },
  sectionTitleOutside: { ...typography.h2, marginBottom: spacing.sm },
  globalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  globalStat: { alignItems: 'center', flex: 1 },
  globalValue: { fontSize: 20, fontWeight: '800', color: colors.textOnColor },
  globalLabel: { fontSize: 13, fontWeight: '500', color: colors.textOnColorMuted, marginTop: 2 },
  globalProgressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  globalProgressFill: { height: '100%', backgroundColor: colors.white, borderRadius: radius.full },
  globalProgressLabel: { fontSize: 12, color: colors.textOnColorMuted, textAlign: 'right' },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  progressLabel: { ...typography.caption, textAlign: 'right' },
  themeCard: { marginBottom: spacing.sm },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  themeName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  themeLevelBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm - 2,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  themeLevelText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  themeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  difficultyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  mutedText: { color: colors.textMuted, fontSize: 12 },
  lockedCard: { marginTop: spacing.sm },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  lockIcon: { fontSize: 13 },
  lockedText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  logoutButton: { marginTop: spacing.lg },
});
