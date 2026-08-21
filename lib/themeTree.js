/**
 * Hiérarchie des thèmes — doit rester strictement identique à
 * frontend_quizzin/lib/themeTree.ts.
 *
 * Un thème absent de THEME_PARENT est un thème "racine" : il se débloque
 * directement depuis Culture-generale (le centre de l'étoile), comme avant.
 * Un thème présent ici ne peut être débloqué qu'une fois son parent déjà
 * débloqué, en plus d'avoir un jeton disponible.
 */
const THEME_PARENT = {
  "Histoire de France": "Histoire",
  "Napoleon": "Histoire de France",
};

function getParent(theme) {
  return THEME_PARENT[theme] ?? null;
}

module.exports = { THEME_PARENT, getParent };
