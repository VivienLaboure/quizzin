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
  'Moyen Âge': 'Histoire',
  'Géographie de la France': 'Géographie',
  'Physique': 'Sciences',
  'Football': 'Sport',
  'Cinéma français': 'Cinéma',
  'Musique classique': 'Musique',
  'Littérature française': 'Art-et-littérature',
  'Informatique': 'Technologie',
  'Système solaire': 'Astronomie',
  'Economie française': 'Economie',
  'Jeux vidéo rétro': 'Jeux vidéos',
  // Deuxième enfant pour chaque racine qui n'en avait qu'un — étoffe
  // l'arbre au-delà de la seule spécialisation "française"/historique.
  'Océans et mers': 'Géographie',
  'Chimie': 'Sciences',
  'Jeux Olympiques': 'Sport',
  'Cinéma d\'animation': 'Cinéma',
  'Musique électronique': 'Musique',
  'Peinture': 'Art-et-littérature',
  'Intelligence artificielle': 'Technologie',
  'Exploration spatiale': 'Astronomie',
  'Grandes crises économiques': 'Economie',
  'Esport': 'Jeux vidéos',
  // Petits-enfants (profondeur 3) — plusieurs branches, pas seulement
  // Histoire de France → Napoleon comme avant.
  'Jeux Olympiques d\'hiver': 'Jeux Olympiques',
  'Studio Ghibli': 'Cinéma d\'animation',
  'IA générative': 'Intelligence artificielle',
  'Opéra': 'Musique classique',
};

export function getParent(theme: string): string | null {
  return THEME_PARENT[theme] ?? null;
}
