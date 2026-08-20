import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../../lib/theme';

interface Props {
  onBack?: () => void;
  title?: string;
}

/** En-tête minimal — remplace les anciens bandeaux pleine couleur en haut/bas d'écran. */
export default function ScreenHeader({ onBack, title }: Props) {
  if (!onBack && !title) return null;

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      {/* Espace symétrique pour centrer le titre quand il y a un bouton retour */}
      {onBack && <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  spacer: {
    width: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
