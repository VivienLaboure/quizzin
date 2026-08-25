/**
 * Nom affiché à l'utilisateur pour un thème, quand il diffère de
 * l'identifiant interne (clé stockée en base, utilisée dans les URLs de
 * navigation, etc.). Ne jamais changer l'identifiant lui-même : il vit dans
 * la base de données de production (document Quiz, unlockedThemes de chaque
 * PersonalScore) — le renommer demanderait une migration. On adapte
 * uniquement l'affichage.
 */
const THEME_DISPLAY_NAMES: Record<string, string> = {
  'Culture-generale': 'Culture générale',
};

export function getThemeDisplayName(theme: string): string {
  return THEME_DISPLAY_NAMES[theme] ?? theme;
}
