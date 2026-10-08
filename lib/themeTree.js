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
  // Deuxième enfant pour chaque racine qui n'en avait qu'un — étoffe
  // l'arbre au-delà de la seule spécialisation "française"/historique.
  "Océans et mers": "Géographie",
  "Chimie": "Sciences",
  "Jeux Olympiques": "Sport",
  "Cinéma d'animation": "Cinéma",
  "Musique électronique": "Musique",
  "Peinture": "Art-et-littérature",
  "Intelligence artificielle": "Technologie",
  "Exploration spatiale": "Astronomie",
  "Grandes crises économiques": "Economie",
  "Esport": "Jeux vidéos",
  // Petits-enfants (profondeur 3) — plusieurs branches, pas seulement
  // Histoire de France → Napoleon comme avant.
  "Jeux Olympiques d'hiver": "Jeux Olympiques",
  "Studio Ghibli": "Cinéma d'animation",
  "IA générative": "Intelligence artificielle",
  "Opéra": "Musique classique",
  // Nouveaux petits-enfants — comblent les branches qui n'avaient encore
  // aucune spécialisation de profondeur 3 (Géographie, Sciences,
  // Art-et-littérature, Economie, Astronomie, Jeux vidéos).
  "Paris": "Géographie de la France",
  "Mécanique quantique": "Physique",
  "Victor Hugo": "Littérature française",
  "La Bourse de Paris": "Economie française",
  "Mars": "Système solaire",
  "League of Legends": "Esport",
};

function getParent(theme) {
  return THEME_PARENT[theme] ?? null;
}

module.exports = { THEME_PARENT, getParent };
