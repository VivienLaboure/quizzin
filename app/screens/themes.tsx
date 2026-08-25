import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { getProfile, getThemes, unlockTheme } from '../../API';
import mockData from '../../api/quizzFR.json';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { IData } from '../../interfaces/IData';
import { GetDifficultyName } from '../../lib/GetDifficultyName';
import { GetThemes } from '../../lib/GetRandomQuizz';
import { getThemeDisplayName } from '../../lib/getThemeDisplayName';
import { getDifficultyForLevel, getLevel } from '../../lib/LevelSystem';
import { colors, difficultyColors, radius, spacing } from '../../lib/theme';
import { getParent } from '../../lib/themeTree';

const DIFFICULTY_COLOR = difficultyColors;

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
// Halo derrière le thème central : plusieurs cercles semi-transparents
// empilés, du plus grand/plus discret au plus petit/plus visible, pour
// simuler un dégradé radial sans dépendance externe.
const GLOW_LAYERS: { scale: number; opacity: number }[] = [
  { scale: 2.6, opacity: 0.05 },
  { scale: 2.0, opacity: 0.07 },
  { scale: 1.5, opacity: 0.09 },
];
// Bornes [min, max] de la taille d'un nœud par profondeur (1 = thème racine,
// 2 = enfant, 3 = petit-enfant, ...) — la taille réelle est calculée pour
// tenir dans cette plage tout en garantissant qu'aucun nœud ne chevauche son
// voisin, quel que soit le nombre de thèmes à un même niveau.
const SIZE_RANGE_BY_DEPTH: [number, number][] = [[0, 0], [46, 84], [40, 68], [36, 56]];
// Bornes [min, max] de la largeur du libellé sous chaque nœud — calculée à
// partir du même espace disponible que le cercle (voir plus bas), jamais
// fixée en dur, sinon le texte peut chevaucher le libellé voisin même quand
// les cercles, eux, ne se touchent pas.
const LABEL_WIDTH_RANGE_BY_DEPTH: [number, number][] = [[0, 0], [44, 92], [40, 78], [36, 68]];
const FONT_SIZE_BY_DEPTH = [0, 11, 10, 9];
const FONT_SIZE_MIN = 8.5;
// Marge de sécurité entre deux nœuds voisins (fraction de l'espace
// disponible réellement occupée par le nœud/libellé) — évite qu'ils se touchent.
const NODE_SAFETY_FACTOR = 0.8;
const LABEL_SAFETY_FACTOR = 0.94;

function sizeRangeForDepth(depth: number): [number, number] {
  return SIZE_RANGE_BY_DEPTH[depth] ?? [30, 44];
}
function labelWidthRangeForDepth(depth: number): [number, number] {
  return LABEL_WIDTH_RANGE_BY_DEPTH[depth] ?? [32, 60];
}
function fontSizeForDepth(depth: number): number {
  return FONT_SIZE_BY_DEPTH[depth] ?? FONT_SIZE_MIN;
}

interface TreeNode {
  theme: string;
  depth: number;
  size: number;
  labelWidth: number;
  x: number;
  y: number;
  parentX: number;
  parentY: number;
}

// Réserve verticale sous chaque nœud pour son libellé (approximative — la
// hauteur réelle du texte varie selon sa longueur) — utilisée à la fois pour
// agrandir le conteneur (voir plus bas dans le composant) et ici pour
// détecter un vrai chevauchement entre le libellé d'un nœud et le cercle ou
// le libellé d'un voisin.
const LABEL_RESERVE = 46;

interface Footprint {
  halfW: number;
  top: number;
  bottom: number;
}

// Deux "empreintes" rectangulaires (centre + demi-largeur + portée haut/bas,
// asymétrique car le libellé ne s'étend que vers le bas) se chevauchent-elles ?
function footprintsOverlap(ax: number, ay: number, a: Footprint, bx: number, by: number, b: Footprint): boolean {
  const aLeft = ax - a.halfW, aRight = ax + a.halfW, aTop = ay - a.top, aBottom = ay + a.bottom;
  const bLeft = bx - b.halfW, bRight = bx + b.halfW, bTop = by - b.top, bBottom = by + b.bottom;
  return aLeft < bRight && bLeft < aRight && aTop < bBottom && bTop < aBottom;
}

/**
 * Éloigne les nœuds d'un même groupe de frères les uns des autres, ET de
 * leur propre parent, jusqu'à ce qu'aucune paire ne se chevauche réellement
 * — plutôt que de se fier à la seule distance à vol d'oiseau (corde) entre
 * deux voisins. Deux nœuds peuvent être à une corde suffisante et pourtant
 * voir leurs boîtes — rectangulaires et alignées sur les axes, pas sur la
 * corde — se recouper : c'est ce qui produisait le chevauchement mesuré
 * entre "Géographie" et "Sciences". Et un nœud qui n'a qu'un seul enfant
 * (pas de frère avec qui le comparer) peut quand même chevaucher le libellé
 * de SON PROPRE parent si la branche ne s'éloigne pas assez : c'est ce qui
 * produisait le chevauchement mesuré entre "Economie" et son enfant
 * "Economie française". On fait donc grandir le rayon jusqu'à ce que plus
 * aucune de ces deux situations ne se produise — jamais on ne rétrécit le
 * texte pour le faire rentrer de force.
 */
function resolveSafeDistance(
  angles: number[],
  initialDist: number,
  maxDist: number,
  size: number,
  labelWidth: number,
  labelReserve: number,
  parentFootprint?: Footprint
): number {
  if (angles.length === 0 || initialDist <= 0) return initialDist;

  const footprint: Footprint = { halfW: labelWidth / 2, top: size / 2, bottom: size / 2 + labelReserve };

  const overlaps = (dist: number) => {
    const positions = angles.map(a => ({ x: dist * Math.cos(a), y: dist * Math.sin(a) }));
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (footprintsOverlap(positions[i].x, positions[i].y, footprint, positions[j].x, positions[j].y, footprint)) {
          return true;
        }
      }
    }
    if (parentFootprint) {
      for (const p of positions) {
        if (footprintsOverlap(0, 0, parentFootprint, p.x, p.y, footprint)) return true;
      }
    }
    return false;
  };

  let dist = initialDist;
  const step = Math.max(2, initialDist * 0.03);
  let iterations = 0;
  while (dist < maxDist && overlaps(dist) && iterations < 200) {
    dist += step;
    iterations++;
  }
  return Math.min(dist, maxDist);
}

/**
 * Construit récursivement la position de chaque thème dans l'arbre :
 * les thèmes racines sont répartis en cercle complet autour du centre, puis
 * chaque enfant est placé dans le prolongement radial de son parent
 * (légèrement éventé si plusieurs frères), à une distance qui rétrécit avec
 * la profondeur. La taille du nœud ET la largeur de son libellé sont toutes
 * les deux dérivées du même espace théoriquement disponible entre frères
 * adjacents à ce niveau (la corde), puis le rayon réel est ajusté (voir
 * resolveSafeDistance) pour garantir qu'aucune boîte ne chevauche
 * vraiment celle d'un voisin.
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

  function place(theme: string, depth: number, x: number, y: number, angle: number, parentX: number, parentY: number, size: number, labelWidth: number) {
    nodes.push({ theme, depth, size, labelWidth, x, y, parentX, parentY });

    const kids = sortByGenerality(childrenOf[theme] ?? []);
    if (kids.length === 0) return;

    const initialDist = radiusByDepth[depth + 1] ?? radiusByDepth[radiusByDepth.length - 1];
    const step = kids.length > 1 ? Math.min(MAX_SPREAD / (kids.length - 1), Math.PI / 6) : 0;
    const [minSize, maxSize] = sizeRangeForDepth(depth + 1);
    const [minLabel, maxLabel] = labelWidthRangeForDepth(depth + 1);
    // Distance curviligne entre deux frères adjacents à cette distance du
    // parent — ni le cercle ni son libellé ne doivent la dépasser.
    const arcSpacing = kids.length > 1 ? initialDist * step : maxSize / NODE_SAFETY_FACTOR;
    const childSize = Math.max(minSize, Math.min(maxSize, arcSpacing * NODE_SAFETY_FACTOR));
    const childLabelWidth = Math.max(minLabel, Math.min(maxLabel, arcSpacing * LABEL_SAFETY_FACTOR));

    const childAngles = kids.map((_, i) => {
      const offset = kids.length > 1 ? (i - (kids.length - 1) / 2) * step : 0;
      return angle + offset;
    });
    // La corde théorique peut suffire alors que les libellés (rectangles
    // alignés sur les axes, pas sur la corde) se chevauchent quand même :
    // on vérifie et on éloigne la branche du parent si besoin. Le parent
    // (ce nœud lui-même, "size"/"labelWidth") est aussi vérifié : un enfant
    // unique n'a pas de frère avec qui se comparer, mais peut chevaucher le
    // libellé de son propre parent si la branche ne s'éloigne pas assez.
    const parentFootprint: Footprint = { halfW: labelWidth / 2, top: size / 2, bottom: size / 2 + LABEL_RESERVE };
    const dist = resolveSafeDistance(childAngles, initialDist, initialDist * 2.5, childSize, childLabelWidth, LABEL_RESERVE, parentFootprint);

    kids.forEach((child, i) => {
      const childAngle = childAngles[i];
      const cx = x + dist * Math.cos(childAngle);
      const cy = y + dist * Math.sin(childAngle);
      place(child, depth + 1, cx, cy, childAngle, x, y, childSize, childLabelWidth);
    });
  }

  const roots = sortByGenerality(themesList.filter(t => t !== CENTER_THEME && !getParent(t)));
  const angleStep = roots.length > 0 ? (2 * Math.PI) / roots.length : 0;
  const initialRootDist = radiusByDepth[1];
  const [minRootSize, maxRootSize] = sizeRangeForDepth(1);
  const [minRootLabel, maxRootLabel] = labelWidthRangeForDepth(1);
  // Corde entre deux thèmes racines adjacents sur le cercle complet — le
  // cercle et son libellé s'ajustent tous deux pour ne jamais la dépasser,
  // qu'il y ait 3 ou 15 thèmes débloquables.
  const rootChord = roots.length > 1 ? 2 * initialRootDist * Math.sin(angleStep / 2) : maxRootSize / NODE_SAFETY_FACTOR;
  const rootSize = Math.max(minRootSize, Math.min(maxRootSize, rootChord * NODE_SAFETY_FACTOR));
  const rootLabelWidth = Math.max(minRootLabel, Math.min(maxRootLabel, rootChord * LABEL_SAFETY_FACTOR));

  const rootAngles = roots.map((_, i) => -Math.PI / 2 + i * angleStep);
  // Comme pour les enfants : la corde théorique entre deux racines adjacentes
  // peut suffire alors que leurs libellés (rectangles) se chevauchent quand
  // même selon l'angle — on vérifie le chevauchement réel et on élargit le
  // cercle des racines si besoin, plutôt que de rétrécir le texte. Le centre
  // (Culture-generale) est traité comme le "parent" des racines : son
  // libellé est à l'intérieur du cercle, pas en dessous, donc pas de réserve.
  const centerFootprint: Footprint = { halfW: CENTER_SIZE / 2, top: CENTER_SIZE / 2, bottom: CENTER_SIZE / 2 };
  const rootDist = resolveSafeDistance(rootAngles, initialRootDist, initialRootDist * 3, rootSize, rootLabelWidth, LABEL_RESERVE, centerFootprint);

  roots.forEach((theme, i) => {
    const angle = rootAngles[i];
    const x = centerX + rootDist * Math.cos(angle);
    const y = centerY + rootDist * Math.sin(angle);
    place(theme, 1, x, y, angle, centerX, centerY, rootSize, rootLabelWidth);
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

  // Déplacement libre de l'arbre (glissement dans n'importe quelle direction,
  // diagonale comprise) + zoom au pincement à deux doigts. Un ScrollView
  // vertical + horizontal imbriqués ne permet qu'un glissement par axe à la
  // fois et pas de zoom du tout : ici, translation 2D (Animated.ValueXY) et
  // échelle (Animated.Value) suivent directement les doigts, comme sur une
  // carte.
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const currentPanRef = useRef({ x: 0, y: 0 });
  const currentScaleRef = useRef(1);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef({ x: 0, y: 0 });
  const pinchStartRef = useRef({ distance: 0, scale: 1 });
  // Combien de doigts étaient posés à la frame précédente — permet de
  // redéfinir le point de départ (glissement ou pincement) exactement au
  // moment où le nombre de doigts change, sans saut visuel.
  const lastTouchCountRef = useRef(0);
  const [hViewport, setHViewport] = useState(0);
  const [vViewport, setVViewport] = useState(0);
  const hasCenteredRef = useRef(false);
  // Toujours à jour (contrairement aux variables de rendu capturées par la
  // fermeture au moment de la création du PanResponder, une seule fois).
  const metricsRef = useRef({ starSize: 0, hViewport: 0, vViewport: 0 });

  const MIN_SCALE = 0.6;
  const MAX_SCALE = 2.5;

  const setPan = useCallback((x: number, y: number) => {
    currentPanRef.current = { x, y };
    pan.setValue({ x, y });
  }, [pan]);

  const setScale = useCallback((s: number) => {
    currentScaleRef.current = s;
    scale.setValue(s);
  }, [scale]);

  // Empêche de glisser l'arbre entièrement hors de vue : la translation
  // reste bornée à ce qui garde au moins un bout du canevas visible dans le
  // viewport ; si le contenu (à l'échelle actuelle) est plus petit que le
  // viewport, il reste centré.
  const clampPan = (x: number, y: number) => {
    const { starSize, hViewport: vw, vViewport: vh } = metricsRef.current;
    const effectiveSize = starSize * currentScaleRef.current;
    const rangeX = vw - effectiveSize;
    const rangeY = vh - effectiveSize;
    return {
      x: rangeX >= 0 ? rangeX / 2 : Math.min(0, Math.max(rangeX, x)),
      y: rangeY >= 0 ? rangeY / 2 : Math.min(0, Math.max(rangeY, y)),
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      // On laisse d'abord les nœuds (TouchableOpacity) gérer le toucher —
      // ce n'est que si le doigt bouge vraiment (glissement, pas un simple
      // tap) ou qu'un second doigt se pose (pincement) que ce conteneur
      // reprend la main pour déplacer/zoomer l'arbre.
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gesture) =>
        evt.nativeEvent.touches.length >= 2 || Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        // Force le recalcul du point de départ dès le premier mouvement,
        // qu'il s'agisse d'un glissement ou d'un pincement.
        lastTouchCountRef.current = 0;
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          const [t1, t2] = touches;
          const dx = t1.pageX - t2.pageX;
          const dy = t1.pageY - t2.pageY;
          const distance = Math.hypot(dx, dy);

          if (lastTouchCountRef.current !== 2) {
            pinchStartRef.current = { distance, scale: currentScaleRef.current };
            lastTouchCountRef.current = 2;
            return;
          }

          const rawScale = pinchStartRef.current.scale * (distance / pinchStartRef.current.distance);
          setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, rawScale)));
          // Le pan reste borné à l'échelle courante, qui vient de changer.
          const clamped = clampPan(currentPanRef.current.x, currentPanRef.current.y);
          setPan(clamped.x, clamped.y);
          return;
        }

        if (touches.length === 1) {
          const t = touches[0];
          if (lastTouchCountRef.current !== 1) {
            // Nouveau point de départ — qu'on vienne du tout début du geste
            // ou qu'on relâche un doigt après un pincement à deux.
            dragStartRef.current = { ...currentPanRef.current };
            touchStartRef.current = { x: t.pageX, y: t.pageY };
            lastTouchCountRef.current = 1;
            return;
          }
          const next = clampPan(
            dragStartRef.current.x + (t.pageX - touchStartRef.current.x),
            dragStartRef.current.y + (t.pageY - touchStartRef.current.y)
          );
          setPan(next.x, next.y);
        }
      },
      onPanResponderRelease: () => {
        lastTouchCountRef.current = 0;
      },
      onPanResponderTerminate: () => {
        lastTouchCountRef.current = 0;
      },
    })
  ).current;

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
      setFeedback(`Débloque d'abord "${getThemeDisplayName(parent)}"`);
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
      setFeedback(`${getThemeDisplayName(pendingTheme)} débloqué !`);
      setPendingTheme(null);
    } catch (error: unknown) {
      setFeedback(error instanceof Error ? error.message : 'Erreur lors du déblocage');
    } finally {
      setUnlocking(false);
    }
  };

  // ─── Géométrie de l'arbre ────────────────────────────────────────────────
  // Les nœuds sont d'abord construits centrés sur l'origine (0,0), avant de
  // savoir quelle taille de conteneur il faudra réellement : une branche
  // profonde (ex: Histoire -> Histoire de France -> Napoleon) s'étend plus
  // loin du centre qu'un simple thème racine, et un conteneur dimensionné
  // seulement pour les racines la laissait dépasser par-dessus la carte des
  // jetons. On calcule donc l'étendue réelle de tous les nœuds une fois
  // placés, et le conteneur grandit en conséquence (jamais plus petit que la
  // taille par défaut, pour garder un bel arbre centré même avec peu de
  // thèmes).
  // Plus de marge latérale réservée par le conteneur (voir pageStyles.content)
  // : l'arbre peut utiliser presque toute la largeur de l'écran par défaut.
  const desiredHalf = Math.min(width * 0.96, 380) / 2;
  const rootRadius = desiredHalf - sizeRangeForDepth(1)[1] / 2 - 4;
  const radiusByDepth = [0, rootRadius, rootRadius * 0.62, rootRadius * 0.5];

  const hasCenter = themesList.includes(CENTER_THEME);
  const rawNodes = buildTreeNodes(themesList, 0, 0, radiusByDepth);

  // Le libellé ne s'étend que vers le bas (sous le cercle) — réservé côté +y
  // (LABEL_RESERVE est défini plus haut, partagé avec buildTreeNodes).
  let reach = desiredHalf;
  for (const node of rawNodes) {
    reach = Math.max(
      reach,
      -(node.x - node.size / 2),
      node.x + node.size / 2,
      -(node.y - node.size / 2),
      node.y + node.size / 2 + LABEL_RESERVE
    );
  }
  const starCenter = reach + 8;
  const starSize = starCenter * 2;
  // Rayon de l'anneau d'orbite des thèmes racines — un simple repère visuel
  // dessiné derrière l'arbre, dans le prolongement esthétique de l'étoile.
  const rootRingRadius = rawNodes.find(n => n.depth === 1)
    ? Math.hypot(rawNodes.find(n => n.depth === 1)!.x, rawNodes.find(n => n.depth === 1)!.y)
    : 0;
  const treeNodes = rawNodes.map(n => ({
    ...n,
    x: n.x + starCenter,
    y: n.y + starCenter,
    parentX: n.parentX + starCenter,
    parentY: n.parentY + starCenter,
  }));

  // Toujours à jour pour que panResponder (créé une seule fois) lise des
  // dimensions fraîches plutôt que celles capturées à sa création.
  metricsRef.current = { starSize, hViewport, vViewport };

  // Une fois l'arbre chargé et le viewport mesuré, on centre la vue sur le
  // thème central (une seule fois — pas à chaque re-render, sinon on
  // arracherait l'utilisateur à l'endroit où il a navigué).
  useEffect(() => {
    if (hasCenteredRef.current || loading || !starSize || !hViewport || !vViewport) return;
    const target = clampPan(hViewport / 2 - starCenter, vViewport / 2 - starCenter);
    setPan(target.x, target.y);
    hasCenteredRef.current = true;
  }, [loading, starSize, starCenter, hViewport, vViewport, setPan]);

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
          // L'arbre peut être bien plus grand que l'écran (beaucoup de
          // thèmes) : ce viewport reste fixe et cadre ce qui est visible
          // (overflow masqué), tandis que le canevas à l'intérieur glisse
          // librement dans n'importe quelle direction — y compris en
          // diagonale, un seul geste combinant les deux axes à la fois — au
          // gré du doigt. Au chargement, il est recentré sur le thème
          // central (voir l'effet plus haut).
          <View
            style={pageStyles.treeViewport}
            onLayout={e => {
              setHViewport(e.nativeEvent.layout.width);
              setVViewport(e.nativeEvent.layout.height);
            }}
            {...panResponder.panHandlers}
          >
          <Animated.View
            style={{
              width: starSize,
              height: starSize,
              // Le zoom s'ancre au centre de l'étoile (translation vers
              // l'origine, mise à l'échelle, translation retour) plutôt
              // qu'au coin du canevas — sinon zoomer ferait dériver
              // visuellement l'arbre au lieu de grandir/rétrécir sur place.
              // React Native applique les transforms de la liste dans
              // l'ordre indiqué (contrairement à la liste `transform` CSS,
              // qui les compose dans l'ordre inverse) : le pivot doit donc
              // être annulé/réappliqué AVANT le déplacement libre (pan),
              // sinon ce dernier est lui-même affecté par l'échelle.
              transform: [
                { translateX: -starCenter },
                { translateY: -starCenter },
                { scale },
                { translateX: starCenter },
                { translateY: starCenter },
                ...pan.getTranslateTransform(),
              ],
            }}
          >
            {/* Halo doux derrière le centre — donne de la profondeur à
                l'étoile sans dépendre d'une lib de dégradé. */}
            {hasCenter && GLOW_LAYERS.map(({ scale, opacity }) => {
              const size = CENTER_SIZE * scale;
              return (
                <View
                  key={`glow-${scale}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: starCenter - size / 2,
                    top: starCenter - size / 2,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: colors.primary,
                    opacity,
                  }}
                />
              );
            })}

            {/* Anneau d'orbite des thèmes racines — simple repère visuel qui
                ancre l'étoile, dans l'esprit d'un arbre de compétences. */}
            {rootRingRadius > 0 && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: starCenter - rootRingRadius,
                  top: starCenter - rootRingRadius,
                  width: rootRingRadius * 2,
                  height: rootRingRadius * 2,
                  borderRadius: rootRingRadius,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.border,
                  opacity: 0.6,
                }}
              />
            )}

            {/* Branches reliant chaque thème à son parent (le centre pour
                les thèmes racines, un autre thème pour les sous-thèmes) —
                trait plein et coloré pour une branche débloquée (chemin
                actif), pointillé discret pour une branche encore
                verrouillée (chemin potentiel, pas encore emprunté). */}
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
                  {isUnlocked ? (
                    <View style={{
                      position: 'absolute',
                      left: 0,
                      top: -1.75,
                      width: length,
                      height: 3.5,
                      borderRadius: 1.75,
                      backgroundColor: colors.primary,
                    }} />
                  ) : (
                    <View style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: length,
                      height: 0,
                      borderTopWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: colors.border,
                    }} />
                  )}
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
                <Text style={pageStyles.centerNodeText}>{getThemeDisplayName(CENTER_THEME)}</Text>
              </TouchableOpacity>
            )}

            {/* Thèmes racines et sous-thèmes — le nœud ne contient qu'une
                icône (jamais de texte à l'intérieur, quelle que soit sa
                taille), le nom du thème est un libellé séparé juste en
                dessous : évite tout chevauchement icône/texte sur les
                petits nœuds. */}
            {treeNodes.map(node => {
              const isUnlocked = unlockedThemes.includes(node.theme);

              return (
                <View
                  key={node.theme}
                  style={{
                    position: 'absolute',
                    left: node.x - node.labelWidth / 2,
                    top: node.y - node.size / 2,
                    width: node.labelWidth,
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
                      ? <View style={[pageStyles.dot, {
                          width: node.size * 0.28,
                          height: node.size * 0.28,
                          borderRadius: node.size * 0.14,
                          backgroundColor: DIFFICULTY_COLOR[getThemeDifficulty(node.theme)],
                          borderWidth: 1.5,
                          borderColor: colors.surface,
                        }]} />
                      : <Text style={{ fontSize: node.size * 0.32 }}>🔒</Text>
                    }
                  </TouchableOpacity>
                  <Text
                    numberOfLines={3}
                    style={[
                      isUnlocked ? pageStyles.nodeTextUnlocked : pageStyles.nodeTextLocked,
                      { fontSize: fontSizeForDepth(node.depth), marginTop: 4 },
                    ]}
                  >
                    {getThemeDisplayName(node.theme)}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
          </View>
        )}
      </View>

      {/* Popup de confirmation de déblocage */}
      {pendingTheme && (
        <View style={pageStyles.overlay}>
          <Card style={pageStyles.popup}>
            <Text style={pageStyles.popupTitle}>Débloquer {pendingTheme ? getThemeDisplayName(pendingTheme) : ''} ?</Text>
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
  // Pas de paddingHorizontal ici : la marge latérale doit rester réservée à
  // la carte d'info (via infoCard ci-dessous), pas s'appliquer aussi au
  // défilement de l'arbre — sinon deux bandes blanches inutiles réduisent la
  // largeur visible de l'arbre alors qu'il a justement besoin de place.
  content: { flex: 1, alignItems: 'center' },
  // overflow:'hidden' cadre le canevas glissant à la taille de l'écran —
  // sans lui, le déplacement libre laisserait voir le reste de l'arbre
  // déborder par-dessus la carte d'info ou le bas de l'écran.
  treeViewport: { flex: 1, width: '100%', overflow: 'hidden' },
  infoCard: { alignSelf: 'stretch', marginHorizontal: spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  infoText: { color: colors.textSecondary, fontSize: 14 },
  mutedText: { color: colors.textMuted, fontSize: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: spacing.md },
  difficultyDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.surface,
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
    // Un léger relief même verrouillé — sinon ces nœuds paraissent cassés
    // à côté des nœuds débloqués en relief, plutôt que simplement "en attente".
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  // Sur le web, un mot long sans espace ("Géographie", "Astronomie"...) ne se
  // coupe pas par défaut et déborde de sa boîte au lieu de passer à la ligne
  // — d'où le chevauchement avec le libellé voisin. Le natif (iOS/Android)
  // n'a pas ce problème, wordBreak n'existe même pas dans ses styles.
  nodeTextUnlocked: {
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { wordBreak: 'break-word' as const } : {}),
  },
  nodeTextLocked: {
    color: colors.textMuted,
    fontWeight: '700',
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { wordBreak: 'break-word' as const } : {}),
  },
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
