/**
 * Hiérarchie des thèmes — doit rester strictement identique à
 * backend_quizzin/lib/themeTree.js.
 *
 * Un thème absent de THEME_PARENT est un thème "racine" : il se débloque
 * directement depuis Culture-generale (le centre de l'étoile). Un thème
 * présent ici ne peut être débloqué qu'une fois son parent déjà débloqué,
 * en plus d'avoir un jeton disponible (contrôlé côté serveur — ce fichier ne
 * sert qu'à construire l'affichage et donner un retour immédiat côté app).
 */
export const THEME_PARENT: Record<string, string> = {
  'Histoire de France': 'Histoire',
  'Napoleon': 'Histoire de France',
};

export function getParent(theme: string): string | null {
  return THEME_PARENT[theme] ?? null;
}
