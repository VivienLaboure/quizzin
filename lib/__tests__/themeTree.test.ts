import { getParent, THEME_PARENT } from '../themeTree';

describe('getParent', () => {
  it('retourne null pour un thème racine (absent de THEME_PARENT)', () => {
    expect(getParent('Histoire')).toBeNull();
    expect(getParent('Culture-generale')).toBeNull();
    expect(getParent('Thème qui n\'existe pas')).toBeNull();
  });

  it('retourne le bon parent pour les thèmes enfants connus', () => {
    expect(getParent('Histoire de France')).toBe('Histoire');
    expect(getParent('Napoleon')).toBe('Histoire de France');
    expect(getParent('Moyen Âge')).toBe('Histoire');
    expect(getParent('Physique')).toBe('Sciences');
  });
});

describe('THEME_PARENT (intégrité de la hiérarchie)', () => {
  it('ne contient aucune boucle — remonter depuis n\'importe quel thème atteint toujours un thème racine', () => {
    // Un thème qui se référence lui-même (directement ou via un cycle) ferait
    // boucler indéfiniment tout code qui remonte l'arbre (ex: vérifier si un
    // thème est débloqué à travers toute sa lignée) — voir buildTreeNodes()
    // dans themes.tsx, qui suppose implicitement cette propriété.
    for (const theme of Object.keys(THEME_PARENT)) {
      const visited = new Set<string>();
      let current: string | null = theme;
      while (current !== null) {
        expect(visited.has(current)).toBe(false);
        visited.add(current);
        current = getParent(current);
        // Filet de sécurité si l'assertion ci-dessus était un jour retirée.
        expect(visited.size).toBeLessThan(Object.keys(THEME_PARENT).length + 1);
      }
    }
  });

  it('un thème n\'est jamais son propre parent', () => {
    for (const [theme, parent] of Object.entries(THEME_PARENT)) {
      expect(parent).not.toBe(theme);
    }
  });
});
