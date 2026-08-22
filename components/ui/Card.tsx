import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadow, spacing } from '../../lib/theme';

interface Props extends ViewProps {
  // Dégradé optionnel (voir lib/theme.ts::gradients) pour une carte "héros"
  // — profil, vue d'ensemble des stats, bannière... Le texte à l'intérieur
  // doit alors utiliser colors.textOnColor / textOnColorMuted.
  gradient?: readonly [string, string, ...string[]];
}

export default function Card({ style, children, gradient, ...rest }: Props) {
  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, style]}
        {...rest}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
});
