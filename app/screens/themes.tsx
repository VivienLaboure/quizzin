import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { getProfile, getThemes, unlockTheme } from '../../API';
import mockData from '../../api/quizzFR.json';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { IData } from '../../interfaces/IData';
import { useAuth } from '../../lib/AuthContext';
import { GetDifficultyName } from '../../lib/GetDifficultyName';
import { GetThemes } from '../../lib/GetRandomQuizz';
import { getDifficultyForLevel, getLevel } from '../../lib/LevelSystem';
import { colors, radius, spacing } from '../../lib/theme';

const DIFFICULTY_COLOR: Record<number, string> = {
  1: '#4CAF50',
  2: '#FF9800',
  3: '#F44336',
};

// Thème central de l'étoile — toujours débloqué, point de départ de la
// progression.
const CENTER_THEME = 'Culture-generale';

// Ordre du plus général au plus niche — détermine uniquement la position
// des thèmes autour de l'étoile (du haut, dans le sens horaire), pas de
// contrainte de déblocage : le joueur reste libre de débloquer n'importe
// quel thème visible dès qu'il a un jeton. Un thème absent de cette liste
// (ajouté plus tard côté contenu) est simplement placé à la fin.
const THEME_ORDER = [
  'Histoire',
  'Géographie',
  'Sciences',
  'Sport',
  'Cinéma',
  'Musique',
  'Art-et-littérature',
  'Technologie',
  'Astronomie',
  'Economie',
  'Jeux vidéos',
];

function sortByGenerality(themes: string[]): string[] {
  return [...themes].sort((a, b) => {
    const ia = THEME_ORDER.indexOf(a);
    const ib = THEME_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

const CENTER_SIZE = 104;
const NODE_SIZE = 84;

const Themes: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams();
  const safeUserId = Array.isArray(userId) ? userId[0] : String(userId ?? '');
  const { width } = useWindowDimensions();

  const isMock = !!Constants.expoConfig?.extra?.MOCK;

  const [themesList, setThemesList] = useState<string[]>([]);
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>([CENTER_THEME]);
  const [unlockTokens, setUnlockTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  // Popup de confirmation de déblocage
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const playerLevel = getLevel(user?.xp ?? 0);
  const difficulty = getDifficultyForLevel(playerLevel);
  const difficultyName = GetDifficultyName(difficulty);
  const difficultyColor = DIFFICULTY_COLOR[difficulty];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isMock) {
        // Mode mock : pas de backend, pas de vrai système de jetons —
        // tous les thèmes sont accessibles pour pouvoir tester le quiz.
        const names = GetThemes(mockData as IData);
        setThemesList(names);
        setUnlockedThemes(names);
        setUnlockTokens(0);
      } else {
        const [names, profile] = await Promise.all([
          getThemes() as Promise<string[]>,
          safeUserId ? getProfile(safeUserId) : Promise.resolve(null),
        ]);
        setThemesList(names);
        if (profile) {
          setUnlockedThemes(profile.unlockedThemes ?? [CENTER_THEME]);
          setUnlockTokens(profile.unlockTokens ?? 0);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des thèmes :', error);
      setThemesList([]);
    } finally {
      setLoading(false);
    }
  }, [isMock, safeUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goToQuiz = (theme: string) => {
    router.push({
      pathname: '/screens/quizzPage',
      params: { category: theme, difficulty: String(difficulty), userId: safeUserId },
    });
  };

  const handleThemePress = (theme: string, isUnlocked: boolean) => {
    if (isUnlocked) {
      goToQuiz(theme);
      return;
    }
    if (unlockTokens < 1) {
      setFeedback('Pas de jeton disponible — monte de niveau pour en gagner !');
      return;
    }
    setPendingTheme(theme);
  };

  const confirmUnlock = async () => {
    if (!pendingTheme || !safeUserId) return;
    setUnlocking(true);
    try {
      const result = await unlockTheme(safeUserId, pendingTheme);
      setUnlockedThemes(result.unlockedThemes ?? [...unlockedThemes, pendingTheme]);
      setUnlockTokens(result.unlockTokens ?? Math.max(0, unlockTokens - 1));
      setFeedback(`${pendingTheme} débloqué !`);
      setPendingTheme(null);
    } catch (error: unknown) {
      setFeedback(error instanceof Error ? error.message : 'Erreur lors du déblocage');
    } finally {
      setUnlocking(false);
    }
  };

  // ─── Géométrie de l'étoile ───────────────────────────────────────────────
  const starSize = Math.min(width * 0.85, 340);
  const starCenter = starSize / 2;
  const radiusPx = starSize / 2 - NODE_SIZE / 2 - 4;

  const outerThemes = sortByGenerality(themesList.filter(t => t !== CENTER_THEME));
  const hasCenter = themesList.includes(CENTER_THEME);
  const angleStep = outerThemes.length > 0 ? (2 * Math.PI) / outerThemes.length : 0;

  return (
    <View style={pageStyles.container}>
      <ScreenHeader onBack={() => router.back()} title="Thèmes" />

      <View style={pageStyles.content}>
        {/* Indicateur de difficulté automatique */}
        <Card style={pageStyles.infoCard}>
          <View style={pageStyles.infoRow}>
            <View style={[pageStyles.dot, { backgroundColor: difficultyColor }]} />
            <Text style={pageStyles.infoText}>
              Difficulté : <Text style={{ fontWeight: '700', color: difficultyColor }}>{difficultyName}</Text>
              {'  '}
              <Text style={pageStyles.mutedText}>(niveau {playerLevel})</Text>
            </Text>
          </View>

          {!isMock && (
            <View style={[pageStyles.infoRow, { marginTop: spacing.sm }]}>
              <Text style={{ fontSize: 18 }}>🔑</Text>
              <Text style={pageStyles.infoText}>
                <Text style={{ fontWeight: '700', color: colors.primary }}>{unlockTokens}</Text> jeton{unlockTokens !== 1 ? 's' : ''} de déblocage
              </Text>
            </View>
          )}
        </Card>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={{ width: starSize, height: starSize, marginTop: spacing.lg }}>
            {/* Rayons reliant le centre à chaque thème */}
            {outerThemes.map((theme, i) => {
              const angle = -Math.PI / 2 + i * angleStep;
              const isUnlocked = unlockedThemes.includes(theme);
              return (
                <View
                  key={`line-${theme}`}
                  style={{
                    position: 'absolute',
                    left: starCenter,
                    top: starCenter,
                    width: 0,
                    height: 0,
                    transform: [{ rotate: `${angle}rad` }],
                  }}
                >
                  <View style={{
                    position: 'absolute',
                    left: 0,
                    top: -1.5,
                    width: radiusPx,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: isUnlocked ? colors.primary : colors.border,
                  }} />
                </View>
              );
            })}

            {/* Thème central */}
            {hasCenter && (
              <TouchableOpacity
                onPress={() => goToQuiz(CENTER_THEME)}
                style={[pageStyles.centerNode, {
                  left: starCenter - CENTER_SIZE / 2,
                  top: starCenter - CENTER_SIZE / 2,
                }]}
              >
                <Text style={pageStyles.centerNodeText}>{CENTER_THEME}</Text>
              </TouchableOpacity>
            )}

            {/* Thèmes autour */}
            {outerThemes.map((theme, i) => {
              const angle = -Math.PI / 2 + i * angleStep;
              const x = starCenter + radiusPx * Math.cos(angle);
              const y = starCenter + radiusPx * Math.sin(angle);
              const isUnlocked = unlockedThemes.includes(theme);

              return (
                <TouchableOpacity
                  key={theme}
                  onPress={() => handleThemePress(theme, isUnlocked)}
                  style={[
                    pageStyles.node,
                    isUnlocked ? pageStyles.nodeUnlocked : pageStyles.nodeLocked,
                    { left: x - NODE_SIZE / 2, top: y - NODE_SIZE / 2 },
                  ]}
                >
                  {!isUnlocked && <Text style={pageStyles.lockIcon}>🔒</Text>}
                  <Text style={isUnlocked ? pageStyles.nodeTextUnlocked : pageStyles.nodeTextLocked}>
                    {theme}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Popup de confirmation de déblocage */}
      {pendingTheme && (
        <View style={pageStyles.overlay}>
          <Card style={pageStyles.popup}>
            <Text style={pageStyles.popupTitle}>Débloquer {pendingTheme} ?</Text>
            <Text style={pageStyles.popupSubtitle}>Cela consommera 1 jeton de déblocage.</Text>
            <View style={pageStyles.popupActions}>
              <TouchableOpacity
                onPress={() => setPendingTheme(null)}
                disabled={unlocking}
                style={pageStyles.cancelButton}
              >
                <Text style={pageStyles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <Button
                label="Débloquer"
                onPress={confirmUnlock}
                loading={unlocking}
                style={pageStyles.confirmButton}
              />
            </View>
          </Card>
        </View>
      )}

      {/* Message de feedback (succès ou erreur de déblocage) */}
      {feedback && (
        <TouchableOpacity onPress={() => setFeedback(null)} style={pageStyles.toast}>
          <Text style={pageStyles.toastText}>{feedback}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const pageStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg },
  infoCard: { width: '100%' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  infoText: { color: colors.textSecondary, fontSize: 14 },
  mutedText: { color: colors.textMuted },
  centerNode: {
    position: 'absolute',
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  centerNodeText: { color: colors.white, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  node: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs + 2,
    borderWidth: 1.5,
  },
  nodeUnlocked: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nodeLocked: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  lockIcon: { fontSize: 15, marginBottom: 2 },
  nodeTextUnlocked: { color: colors.textPrimary, fontWeight: '700', fontSize: 11, textAlign: 'center' },
  nodeTextLocked: { color: colors.textMuted, fontWeight: '700', fontSize: 11, textAlign: 'center' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: { width: '80%', alignItems: 'center' },
  popupTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
  popupSubtitle: { color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  popupActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: { color: colors.textSecondary, fontWeight: '700' },
  confirmButton: { flex: 1 },
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: colors.textPrimary,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    maxWidth: '85%',
  },
  toastText: { color: colors.white, fontSize: 13, textAlign: 'center' },
});

export default Themes;
