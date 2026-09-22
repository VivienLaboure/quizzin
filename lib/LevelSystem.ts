/**
 * Système de niveaux.
 *
 * Doit rester strictement identique à backend_quizzin/lib/levelSystem.js —
 * le serveur recalcule ces mêmes seuils pour détecter un passage de niveau
 * et attribuer les jetons de déblocage de thème (voir scoreControllers.js).
 *
 * Croissance exponentielle : l'XP nécessaire pour passer du niveau n au
 * niveau n+1 vaut BASE_XP × GROWTH_RATE^(n-1), donc chaque niveau coûte
 * 30 % de XP en plus que le précédent — la progression ralentit de plus en
 * plus, contrairement à l'ancienne courbe quadratique où l'écart ne
 * grandissait que linéairement.
 *
 *   Niveau  1 :      0 XP
 *   Niveau  2 :     50 XP  (+50)
 *   Niveau  3 :    115 XP  (+65)
 *   Niveau  4 :    200 XP  (+85)
 *   Niveau  5 :    310 XP  (+110)
 *   Niveau 10 :  1 602 XP  (+408 depuis le niveau 9)
 *   Niveau 20 : 24 199 XP  (+5 623 depuis le niveau 19)
 */
const BASE_XP = 50;
const GROWTH_RATE = 1.3;

// thresholdCache[i] = XP total nécessaire pour atteindre le niveau i + 1
// (thresholdCache[0] = 0 XP pour le niveau 1). Étendu à la demande et
// mémorisé pour éviter de recalculer toute la suite à chaque appel.
const thresholdCache: number[] = [0];

function extendCacheTo(level: number): void {
  while (thresholdCache.length < level) {
    const n = thresholdCache.length; // niveau du dernier seuil connu dans le cache
    const increment = Math.round(BASE_XP * Math.pow(GROWTH_RATE, n - 1));
    thresholdCache.push(thresholdCache[n - 1] + increment);
  }
}

/** XP total nécessaire pour atteindre le niveau `level`. */
export function getLevelThreshold(level: number): number {
  if (level <= 1) return 0;
  extendCacheTo(level);
  return thresholdCache[level - 1];
}

/** Retourne le niveau correspondant à `xp` points d'expérience. */
export function getLevel(xp: number): number {
  if (xp <= 0) return 1;
  let level = 1;
  while (getLevelThreshold(level + 1) <= xp) {
    level++;
  }
  return level;
}

/**
 * Jetons de déblocage cumulés à un niveau donné : un jeton tous les 2
 * niveaux (niveau 2 → 1 jeton, niveau 4 → 2 jetons, ...) plutôt qu'un par
 * niveau, pour que les jetons restent rares même si le joueur enchaîne les
 * niveaux rapidement en début de partie. Doit rester identique à
 * getTokensForLevel() dans backend_quizzin/lib/levelSystem.js — c'est le
 * serveur qui attribue réellement les jetons, cette copie ne sert qu'à
 * afficher le bon nombre dans l'animation de résultats.
 */
export function getTokensForLevel(level: number): number {
  return Math.floor(level / 2);
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
