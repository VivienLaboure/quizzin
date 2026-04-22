/**
 * Système de niveaux — calcul purement front-end.
 *
 * Seuil d'XP pour le niveau n : 25 × n × (n − 1)
 *   Niveau 1 :     0 XP
 *   Niveau 2 :    50 XP
 *   Niveau 3 :   150 XP
 *   Niveau 4 :   300 XP
 *   Niveau 5 :   500 XP
 *   Niveau 10 : 2 250 XP
 */

/** XP total nécessaire pour atteindre le niveau `level`. */
export function getLevelThreshold(level: number): number {
  return 25 * level * (level - 1);
}

/**
 * Retourne le niveau correspondant à `xp` points d'expérience.
 * Résout n*(n-1) ≤ xp/25  →  n = ⌊(1 + √(1 + 4·xp/25)) / 2⌋
 */
export function getLevel(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor((1 + Math.sqrt(1 + (4 * xp) / 25)) / 2);
}

export interface LevelProgress {
  level: number;
  currentXp: number; // XP accumulée dans le niveau actuel
  neededXp: number;  // XP nécessaire pour passer au niveau suivant
  progress: number;  // 0.0 → 1.0
}

/** Décompose `xp` en progression dans le niveau courant. */
export function getLevelProgress(xp: number): LevelProgress {
  const level = getLevel(xp);
  const thisLevelXp = getLevelThreshold(level);
  const nextLevelXp = getLevelThreshold(level + 1);
  const currentXp = xp - thisLevelXp;
  const neededXp = nextLevelXp - thisLevelXp;
  return { level, currentXp, neededXp, progress: currentXp / neededXp };
}

/**
 * Difficulté automatique selon le niveau du joueur.
 *   Niveaux 1–3  → Facile   (1)
 *   Niveaux 4–6  → Moyen    (2)
 *   Niveau  7+   → Difficile (3)
 */
export function getDifficultyForLevel(level: number): number {
  if (level <= 3) return 1;
  if (level <= 6) return 2;
  return 3;
}

/**
 * Multiplicateur d'XP selon la difficulté.
 *   1 (Facile)   → ×1.0
 *   2 (Moyen)    → ×1.5
 *   3 (Difficile) → ×2.0
 */
const DIFFICULTY_MULTIPLIER: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.0,
};

/**
 * XP gagnée selon le nombre de bonnes réponses consécutives et la difficulté.
 * Base : streak × 10 + bonus de 25 XP par tranche de 5, puis × multiplicateur de difficulté.
 *
 * Exemples (Facile / Moyen / Difficile) :
 *   streak 1  →  10 /  15 /  20 XP
 *   streak 5  →  75 / 113 / 150 XP
 *   streak 10 → 150 / 225 / 300 XP
 */
export function computeXpGained(streak: number, difficulty: number = 1): number {
  if (streak <= 0) return 0;
  const base = streak * 10 + Math.floor(streak / 5) * 25;
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.0;
  return Math.round(base * multiplier);
}
