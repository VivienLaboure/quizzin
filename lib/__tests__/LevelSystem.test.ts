import {
  computeXpGained,
  getDifficultyForLevel,
  getLevel,
  getLevelProgress,
  getLevelThreshold,
  getTokensForLevel,
} from '../LevelSystem';

// Valeurs tirées directement des exemples documentés en commentaire dans
// LevelSystem.ts — si ces tests cassent, c'est que la courbe a changé, ce
// qui doit alors être répercuté manuellement dans levelSystem.js côté
// backend (les deux fichiers doivent rester strictement identiques).
describe('getLevelThreshold', () => {
  it('vaut 0 pour le niveau 1 (et tout niveau <= 1)', () => {
    expect(getLevelThreshold(1)).toBe(0);
    expect(getLevelThreshold(0)).toBe(0);
    expect(getLevelThreshold(-5)).toBe(0);
  });

  it('suit la courbe exponentielle documentée', () => {
    expect(getLevelThreshold(2)).toBe(50);
    expect(getLevelThreshold(3)).toBe(115);
    expect(getLevelThreshold(4)).toBe(200);
    expect(getLevelThreshold(5)).toBe(310);
    expect(getLevelThreshold(10)).toBe(1602);
    expect(getLevelThreshold(20)).toBe(24199);
  });

  it('est strictement croissant (chaque niveau coûte plus cher que le précédent)', () => {
    for (let level = 1; level < 30; level++) {
      const gap = getLevelThreshold(level + 1) - getLevelThreshold(level);
      const nextGap = getLevelThreshold(level + 2) - getLevelThreshold(level + 1);
      expect(nextGap).toBeGreaterThan(gap);
    }
  });
});

describe('getLevel', () => {
  it('retourne 1 pour une XP nulle ou négative', () => {
    expect(getLevel(0)).toBe(1);
    expect(getLevel(-10)).toBe(1);
  });

  it('reste au niveau courant juste avant le seuil, et monte pile au seuil', () => {
    expect(getLevel(49)).toBe(1);
    expect(getLevel(50)).toBe(2);
    expect(getLevel(114)).toBe(2);
    expect(getLevel(115)).toBe(3);
  });

  it('est l\'inverse de getLevelThreshold (round-trip cohérent)', () => {
    for (let level = 1; level <= 15; level++) {
      const threshold = getLevelThreshold(level);
      expect(getLevel(threshold)).toBe(level);
    }
  });
});

describe('getTokensForLevel', () => {
  it('donne un jeton tous les 2 niveaux', () => {
    expect(getTokensForLevel(1)).toBe(0);
    expect(getTokensForLevel(2)).toBe(1);
    expect(getTokensForLevel(3)).toBe(1);
    expect(getTokensForLevel(4)).toBe(2);
    expect(getTokensForLevel(5)).toBe(2);
  });
});

describe('getLevelProgress', () => {
  it('est cohérent avec getLevel et getLevelThreshold', () => {
    const xp = 500;
    const progress = getLevelProgress(xp);
    expect(progress.level).toBe(getLevel(xp));
    expect(progress.currentXp).toBe(xp - getLevelThreshold(progress.level));
    expect(progress.neededXp).toBe(getLevelThreshold(progress.level + 1) - getLevelThreshold(progress.level));
  });

  it('reste entre 0 (inclus) et 1 (exclu) — jamais négatif ni >= 1 pour une XP valide', () => {
    for (const xp of [0, 1, 49, 50, 114, 115, 999, 5000]) {
      const { progress } = getLevelProgress(xp);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    }
  });
});

describe('getDifficultyForLevel', () => {
  it('mappe les tranches de niveaux documentées', () => {
    expect(getDifficultyForLevel(1)).toBe(1);
    expect(getDifficultyForLevel(3)).toBe(1);
    expect(getDifficultyForLevel(4)).toBe(2);
    expect(getDifficultyForLevel(6)).toBe(2);
    expect(getDifficultyForLevel(7)).toBe(3);
    expect(getDifficultyForLevel(100)).toBe(3);
  });
});

describe('computeXpGained', () => {
  it('vaut 0 pour un streak nul ou négatif', () => {
    expect(computeXpGained(0)).toBe(0);
    expect(computeXpGained(-3)).toBe(0);
  });

  it('suit les valeurs documentées par streak et difficulté', () => {
    expect(computeXpGained(1, 1)).toBe(10);
    expect(computeXpGained(1, 2)).toBe(15);
    expect(computeXpGained(1, 3)).toBe(20);

    expect(computeXpGained(5, 1)).toBe(75);
    expect(computeXpGained(5, 2)).toBe(113);
    expect(computeXpGained(5, 3)).toBe(150);

    expect(computeXpGained(10, 1)).toBe(150);
    expect(computeXpGained(10, 2)).toBe(225);
    expect(computeXpGained(10, 3)).toBe(300);
  });

  it('utilise le multiplicateur facile (x1.0) pour une difficulté inconnue', () => {
    expect(computeXpGained(10, 99)).toBe(computeXpGained(10, 1));
  });
});
