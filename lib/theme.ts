/**
 * Design system partagé — structure épurée, palette riche.
 *
 * Remplace les styles inline dupliqués écran par écran par un jeu de
 * constantes communes (couleurs, dégradés, espacements, rayons,
 * typographie, ombres). Un seul endroit à modifier pour ajuster
 * l'identité visuelle de toute l'app.
 */

export const colors = {
  primary: '#FF6347',
  primaryDark: '#E5502F',
  primarySoft: '#FFF1EC',

  // Couleur secondaire (indigo) — distingue les actions/stats secondaires
  // du orange principal, sans retomber sur du gris neutre partout.
  secondary: '#6C5CE7',
  secondaryDark: '#5847D1',
  secondarySoft: '#F0EEFE',

  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#EFEFEF',

  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#A3A3A3',
  // Texte sur fond coloré (dégradés, bannières) — jamais textPrimary/Secondary,
  // pensés pour un fond clair.
  textOnColor: '#FFFFFF',
  textOnColorMuted: 'rgba(255,255,255,0.82)',

  success: '#2FA84F',
  successSoft: '#EAF7EE',
  error: '#E5484D',
  errorSoft: '#FDEDEE',

  // Podium du classement amis — remplace le simple emoji par un vrai accent
  // de couleur sur les 3 premières places.
  gold: '#F4B942',
  silver: '#B8C0CC',
  bronze: '#D08A5C',

  white: '#FFFFFF',
  overlay: 'rgba(20,20,20,0.55)',
} as const;

// Difficulté d'un thème — centralisé ici (était dupliqué dans themes.tsx et
// stats.tsx). Typé en Record<number, string> (pas `as const`) pour rester
// indexable par une valeur de difficulté calculée à l'exécution.
export const difficultyColors: Record<number, string> = {
  1: '#4CAF50',
  2: '#FF9800',
  3: '#F44336',
};

// Paires de dégradés nommées (utilisées avec expo-linear-gradient) — la
// structure des écrans reste épurée, mais les zones héros (carte profil,
// bannières, boutons principaux) gagnent en profondeur/personnalité au lieu
// d'un simple aplat de couleur.
export const gradients = {
  primary: ['#FF8A65', '#FF6347'] as const,
  primaryStrong: ['#FF6347', '#E5502F'] as const,
  sunset: ['#FF6347', '#C2185B'] as const,
  secondary: ['#8C7AF0', '#6C5CE7'] as const,
  ocean: ['#4A90D9', '#6C5CE7'] as const,
  success: ['#6FCF97', '#2FA84F'] as const,
  gold: ['#FCD980', '#F4B942'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 13, fontWeight: '500' as const, color: colors.textMuted },
} as const;

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;
