/**
 * Doit rester strictement identique à frontend_quizzin/lib/LevelSystem.ts
 * (mêmes constantes BASE_XP/GROWTH_RATE, même logique de calcul).
 *
 * Utilisé côté serveur uniquement pour détecter un passage de niveau de
 * façon fiable lors d'une mise à jour d'XP, et attribuer les jetons de
 * déblocage de thème en conséquence — cette détection doit se baser sur la
 * valeur d'XP *avant* déjà stockée en base, jamais sur une valeur "avant"
 * fournie par le client, sans quoi un client malveillant pourrait se
 * fabriquer des jetons en mentant sur son XP de départ.
 *
 * Croissance exponentielle : l'XP nécessaire pour passer du niveau n au
 * niveau n+1 vaut BASE_XP × GROWTH_RATE^(n-1) — voir LevelSystem.ts pour le
 * détail et une table d'exemple.
 */
const BASE_XP = 50;
const GROWTH_RATE = 1.3;

// thresholdCache[i] = XP total nécessaire pour atteindre le niveau i + 1
const thresholdCache = [0];

function extendCacheTo(level) {
  while (thresholdCache.length < level) {
    const n = thresholdCache.length;
    const increment = Math.round(BASE_XP * Math.pow(GROWTH_RATE, n - 1));
    thresholdCache.push(thresholdCache[n - 1] + increment);
  }
}

function getLevelThreshold(level) {
  if (level <= 1) return 0;
  extendCacheTo(level);
  return thresholdCache[level - 1];
}

function getLevel(xp) {
  if (xp <= 0) return 1;
  let level = 1;
  while (getLevelThreshold(level + 1) <= xp) {
    level++;
  }
  return level;
}

module.exports = { getLevel, getLevelThreshold };
