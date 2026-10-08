import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../../lib/theme';

interface Props {
  message?: string;
  style?: ViewStyle;
}

/**
 * Chargement compact — pour l'intérieur d'un écran déjà affiché (en-tête,
 * onglet actif déjà visibles) : arbre des thèmes, profil, listes de
 * l'écran amis... Remplace le simple ActivityIndicator isolé, sans repère
 * ni contexte, utilisé partout jusqu'ici. Pour un chargement PLEIN ÉCRAN où
 * rien d'autre n'est encore affiché, voir LoadingScreen (avec le logo).
 */
export default function Loader({ message, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.badge}>
        <ActivityIndicator color={colors.primary} />
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
