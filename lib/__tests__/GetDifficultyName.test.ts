import { GetDifficultyName } from '../GetDifficultyName';

describe('GetDifficultyName', () => {
  it('mappe chaque identifiant numérique connu', () => {
    expect(GetDifficultyName(1)).toBe('Facile');
    expect(GetDifficultyName(2)).toBe('Moyen');
    expect(GetDifficultyName(3)).toBe('Difficile');
  });

  it('retourne un message de repli pour un identifiant inconnu', () => {
    expect(GetDifficultyName(0)).toBe('Difficulté non trouvée');
    expect(GetDifficultyName(99)).toBe('Difficulté non trouvée');
  });
});
