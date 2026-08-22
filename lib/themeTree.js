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
  "Moyen Âge": "Histoire",
  "Géographie de la France": "Géographie",
  "Physique": "Sciences",
  "Football": "Sport",
  "Cinéma français": "Cinéma",
  "Musique classique": "Musique",
  "Littérature française": "Art-et-littérature",
  "Informatique": "Technologie",
  "Système solaire": "Astronomie",
  "Economie française": "Economie",
  "Jeux vidéo rétro": "Jeux vidéos",
};

function getParent(theme) {
  return THEME_PARENT[theme] ?? null;
}

module.exports = { THEME_PARENT, getParent };
