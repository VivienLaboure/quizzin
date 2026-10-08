import { getThemeDisplayName } from '../getThemeDisplayName';

describe('getThemeDisplayName', () => {
  it('enlève le tiret de l\'identifiant interne du thème central', () => {
    expect(getThemeDisplayName('Culture-generale')).toBe('Culture générale');
  });

  it('retourne le thème tel quel quand il n\'a pas de nom d\'affichage dédié', () => {
    expect(getThemeDisplayName('Histoire')).toBe('Histoire');
    expect(getThemeDisplayName('Napoleon')).toBe('Napoleon');
  });
});
