/**
 * Design system partagé — direction épurée/minimaliste.
 *
 * Remplace les styles inline dupliqués écran par écran par un jeu de
 * constantes communes (couleurs, espacements, rayons, typographie,
 * ombres). Un seul endroit à modifier pour ajuster l'identité visuelle
 * de toute l'app.
 */

export const colors = {
  primary: '#FF6347',
  primaryDark: '#E5502F',
  primarySoft: '#FFF1EC',

  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#EFEFEF',

  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#A3A3A3',

  success: '#2FA84F',
  successSoft: '#EAF7EE',
  error: '#E5484D',
  errorSoft: '#FDEDEE',

  white: '#FFFFFF',
  overlay: 'rgba(20,20,20,0.55)',
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
