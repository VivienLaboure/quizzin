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
import { GetDifficultyName } from '../../lib/GetDifficultyName';
import { GetThemes } from '../../lib/GetRandomQuizz';
import { getDifficultyForLevel, getLevel } from '../../lib/LevelSystem';
import { colors, radius, spacing } from '../../lib/theme';
import { getParent } from '../../lib/themeTree';

const DIFFICULTY_COLOR: Record<number, string> = {
  1: '#4CAF50',
  2: '#FF9800',
  3: '#F44336',
};

// Thème central de l'étoile — toujours débloqué, point de départ de la
// progression.
const CENTER_THEME = 'Culture-generale';

// Ordre du plus général au plus niche — détermine uniquement la position
// des thèmes racines autour du centre (du haut, dans le sens horaire) et
// l'ordre des enfants d'un même parent. N'impose aucune contrainte de
// déblocage pour les thèmes racines (libre choix dès qu'un jeton est
// disponible) ; les sous-thèmes, eux, exigent leur parent débloqué au
// préalable (voir lib/themeTree.ts).
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
// Bornes [min, max] de la taille d'un nœud par profondeur (1 = thème racine,
// 2 = enfant, 3 = petit-enfant, ...) — la taille réelle est calculée pour
// tenir dans cette plage tout en garantissant qu'aucun nœud ne chevauche son
// voisin, quel que soit le nombre de thèmes à un même niveau.
const SIZE_RANGE_BY_DEPTH: [number, number][] = [[0, 0], [46, 84], [40, 68], [36, 56]];
const FONT_SIZE_BY_DEPTH = [0, 11, 10, 9];
const FONT_SIZE_MIN = 8.5;
const LABEL_WIDTH_BY_DEPTH = [0, 78, 66, 58];
const LABEL_WIDTH_MIN = 52;
// Marge de sécurité entre deux nœuds voisins (fraction de l'espace
// disponible réellement occupée par le nœud) — évite qu'ils se touchent.
const SAFETY_FACTOR = 0.8;

function sizeRangeForDepth(depth: number): [number, number] {
  return SIZE_RANGE_BY_DEPTH[depth] ?? [30, 44];
}
function fontSizeForDepth(depth: number): number {
  return FONT_SIZE_BY_DEPTH[depth] ?? FONT_SIZE_MIN;
}
function labelWidthForDepth(depth: number): number {
  return LABEL_WIDTH_BY_DEPTH[depth] ?? LABEL_WIDTH_MIN;
}

interface TreeNode {
  theme: string;
  depth: number;
  size: number;
  x: number;
  y: number;
  parentX: number;
  parentY: number;
}

/**
 * Construit récursivement la position de chaque thème dans l'arbre :
 * les thèmes racines sont répartis en cercle complet autour du centre, puis
 * chaque enfant est placé dans le prolongement radial de son parent
 * (légèrement éventé si plusieurs frères), à une distance qui rétrécit avec
 * la profondeur. La taille de chaque nœud est recalculée à partir du nombre
 * de frères à ce niveau, pour qu'ils ne se chevauchent jamais même si
 * beaucoup de thèmes partagent le même parent.
 */
function buildTreeNodes(themesList: string[], centerX: number, centerY: number, radiusByDepth: number[]): TreeNode[] {
  const childrenOf: Record<string, string[]> = {};
  for (const theme of themesList) {
    const parent = getParent(theme);
    if (parent) {
      (childrenOf[parent] ??= []).push(theme);
    }
  }

  const nodes: TreeNode[] = [];
  const MAX_SPREAD = Math.PI / 3; // 60° d'éventail maximum entre le premier et le dernier frère

  function place(theme: string, depth: number, x: number, y: number, angle: number, parentX: number, parentY: number, size: number) {
    nodes.push({ theme, depth, size, x, y, parentX, parentY });

    const kids = sortByGenerality(childrenOf[theme] ?? []);
    if (kids.length === 0) return;

    const dist = radiusByDepth[depth + 1] ?? radiusByDepth[radiusByDepth.length - 1];
    const step = kids.length > 1 ? Math.min(MAX_SPREAD / (kids.length - 1), Math.PI / 6) : 0;
    const [minSize, maxSize] = sizeRangeForDepth(depth + 1);
    // Distance curviligne entre deux frères adjacents à cette distance du
    // parent — la taille du nœud ne doit jamais la dépasser.
    const arcSpacing = kids.length > 1 ? dist * step : maxSize / SAFETY_FACTOR;
    const childSize = Math.max(minSize, Math.min(maxSize, arcSpacing * SAFETY_FACTOR));

    kids.forEach((child, i) => {
      const offset = kids.length > 1 ? (i - (kids.length - 1) / 2) * step : 0;
      const childAngle = angle + offset;
      const cx = x + dist * Math.cos(childAngle);
      const cy = y + dist * Math.sin(childAngle);
      place(child, depth + 1, cx, cy, childAngle, x, y, childSize);
    });
  }

  const roots = sortByGenerality(themesList.filter(t => t !== CENTER_THEME && !getParent(t)));
  const angleStep = roots.length > 0 ? (2 * Math.PI) / roots.length : 0;
  const rootDist = radiusByDepth[1];
  const [minRootSize, maxRootSize] = sizeRangeForDepth(1);
  // Corde entre deux thèmes racines adjacents sur le cercle complet — la
  // taille des nœuds racines s'ajuste pour ne jamais dépasser cette corde,
  // qu'il y ait 3 ou 15 thèmes débloquables.
  const rootChord = roots.length > 1 ? 2 * rootDist * Math.sin(angleStep / 2) : maxRootSize / SAFETY_FACTOR;
  const rootSize = Math.max(minRootSize, Math.min(maxRootSize, rootChord * SAFETY_FACTOR));

  roots.forEach((theme, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = centerX + rootDist * Math.cos(angle);
    const y = centerY + rootDist * Math.sin(angle);
    place(theme, 1, x, y, angle, centerX, centerY, rootSize);
  });

  return nodes;
}

const Themes: React.FC = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const safeUserId = Array.isArray(userId) ? userId[0] : String(userId ?? '');
  const { width } = useWindowDimensions();

  const isMock = !!Constants.expoConfig?.extra?.MOCK;

  const [themesList, setThemesList] = useState<string[]>([]);
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>([CENTER_THEME]);
  const [unlockTokens, setUnlockTokens] = useState(0);
  // XP par thème — chaque thème a sa propre difficulté, indépendante des
  // autres et du niveau global du joueur (voir lib/LevelSystem.ts).
  const [themeXp, setThemeXp] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Popup de confirmation de déblocage
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getThemeDifficulty = (theme: string) => getDifficultyForLevel(getLevel(themeXp[theme] ?? 0));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isMock) {
        // Mode mock : pas de backend, pas de vrai système de progression par
        // thème — tous les thèmes sont accessibles, difficulté la plus
        // simple partout, pour pouvoir tester le quiz.
        const names = GetThemes(mockData as IData);
        setThemesList(names);
        setUnlockedThemes(names);
        setUnlockTokens(0);
        setThemeXp({});
      } else {
        const [names, profile] = await Promise.all([
          getThemes() as Promise<string[]>,
          safeUserId ? getProfile(safeUserId) : Promise.resolve(null),
        ]);
        setThemesList(names);
        if (profile) {
          setUnlockedThemes(profile.unlockedThemes ?? [CENTER_THEME]);
          setUnlockTokens(profile.unlockTokens ?? 0);
          setThemeXp(profile.themeXp ?? {});
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
      params: { category: theme, difficulty: String(getThemeDifficulty(theme)), userId: safeUserId },
    });
  };

  const handleThemePress = (theme: string, isUnlocked: boolean) => {
    if (isUnlocked) {
      goToQuiz(theme);
      return;
    }

    const parent = getParent(theme);
    if (parent && !unlockedThemes.includes(parent)) {
      setFeedback(`Débloque d'abord "${parent}"`);
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

  // ─── Géométrie de l'arbre ────────────────────────────────────────────────
  const starSize = Math.min(width * 0.9, 380);
  const starCenter = starSize / 2;
  const rootRadius = starSize / 2 - sizeRangeForDepth(1)[1] / 2 - 4;
  const radiusByDepth = [0, rootRadius, rootRadius * 0.62, rootRadius * 0.5];

  const hasCenter = themesList.includes(CENTER_THEME);
  const treeNodes = buildTreeNodes(themesList, starCenter, starCenter, radiusByDepth);

  return (
    <View style={pageStyles.container}>
      <ScreenHeader onBack={() => router.back()} title="Thèmes" />

      <View style={pageStyles.content}>
        <Card style={pageStyles.infoCard}>
          {!isMock && (
            <View style={pageStyles.infoRow}>
              <Text style={{ fontSize: 18 }}>🔑</Text>
              <Text style={pageStyles.infoText}>
                <Text style={{ fontWeight: '700', color: colors.primary }}>{unlockTokens}</Text> jeton{unlockTokens !== 1 ? 's' : ''} de déblocage
              </Text>
            </View>
          )}

          {/* Légende : chaque thème progresse en difficulté indépendamment,
              d'où le point de couleur sur chaque nœud débloqué. */}
          <View style={[pageStyles.infoRow, { marginTop: isMock ? 0 : spacing.sm, flexWrap: 'wrap' }]}>
            {([1, 2, 3] as const).map(d => (
              <View key={d} style={pageStyles.legendItem}>
                <View style={[pageStyles.dot, { backgroundColor: DIFFICULTY_COLOR[d] }]} />
                <Text style={pageStyles.mutedText}>{GetDifficultyName(d)}</Text>
              </View>
            ))}
          </View>
        </Card>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={{ width: starSize, height: starSize, marginTop: spacing.lg }}>
            {/* Branches reliant chaque thème à son parent (le centre pour
                les thèmes racines, un autre thème pour les sous-thèmes) */}
            {treeNodes.map(node => {
              const dx = node.x - node.parentX;
              const dy = node.y - node.parentY;
              const length = Math.hypot(dx, dy);
              const angle = Math.atan2(dy, dx);
              const isUnlocked = unlockedThemes.includes(node.theme);
              return (
                <View
                  key={`line-${node.theme}`}
                  style={{
                    position: 'absolute',
                    left: node.parentX,
                    top: node.parentY,
                    width: 0,
                    height: 0,
                    transform: [{ rotate: `${angle}rad` }],
                  }}
                >
                  <View style={{
                    position: 'absolute',
                    left: 0,
                    top: -1.5,
                    width: length,
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
                <View style={[pageStyles.difficultyDot, { backgroundColor: DIFFICULTY_COLOR[getThemeDifficulty(CENTER_THEME)] }]} />
                <Text style={pageStyles.centerNodeText}>{CENTER_THEME}</Text>
              </TouchableOpacity>
            )}

            {/* Thèmes racines et sous-thèmes — le nœud ne contient qu'une
                icône (jamais de texte à l'intérieur, quelle que soit sa
                taille), le nom du thème est un libellé séparé juste en
                dessous : évite tout chevauchement icône/texte sur les
                petits nœuds. */}
            {treeNodes.map(node => {
              const isUnlocked = unlockedThemes.includes(node.theme);
              const labelWidth = labelWidthForDepth(node.depth);

              return (
                <View
                  key={node.theme}
                  style={{
                    position: 'absolute',
                    left: node.x - labelWidth / 2,
                    top: node.y - node.size / 2,
                    width: labelWidth,
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleThemePress(node.theme, isUnlocked)}
                    style={[
                      pageStyles.node,
                      isUnlocked ? pageStyles.nodeUnlocked : pageStyles.nodeLocked,
                      { width: node.size, height: node.size, borderRadius: node.size / 2 },
                    ]}
                  >
                    {isUnlocked
                      ? <View style={[pageStyles.dot, { width: node.size * 0.28, height: node.size * 0.28, borderRadius: node.size * 0.14, backgroundColor: DIFFICULTY_COLOR[getThemeDifficulty(node.theme)] }]} />
                      : <Text style={{ fontSize: node.size * 0.32 }}>🔒</Text>
                    }
                  </TouchableOpacity>
                  <Text
                    numberOfLines={2}
                    style={[
                      isUnlocked ? pageStyles.nodeTextUnlocked : pageStyles.nodeTextLocked,
                      { fontSize: fontSizeForDepth(node.depth), marginTop: 4 },
                    ]}
                  >
                    {node.theme}
                  </Text>
                </View>
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
  mutedText: { color: colors.textMuted, fontSize: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: spacing.md },
  difficultyDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  nodeUnlocked: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  nodeLocked: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  nodeTextUnlocked: { color: colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  nodeTextLocked: { color: colors.textMuted, fontWeight: '700', textAlign: 'center' },
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
