import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../lib/theme';

interface Props {
  message?: string;
}

/**
 * Chargement plein écran, avec le logo de l'app — pour les moments où rien
 * d'autre n'est encore affiché (lancement de l'app, avant de savoir si une
 * session existe ; préparation d'un quiz, avant la première question).
 * Auparavant : rien du tout au lancement (écran blanc le temps de vérifier
 * la session), ou un simple rond isolé sans aucun repère de marque.
 * Pour un chargement À L'INTÉRIEUR d'un écran déjà affiché (arbre des
 * thèmes, profil, amis...), voir Loader — plus compact, sans le logo qui
 * serait redondant avec l'en-tête déjà visible.
 */
export default function LoadingScreen({ message }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../app/assets/logo_text.png')}
        style={[styles.logo, { transform: [{ scale: pulse }] }]}
        resizeMode="contain"
      />
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: {
    width: 160,
    height: 70,
    marginBottom: spacing.xl,
  },
  spinner: {
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
