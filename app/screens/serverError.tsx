import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { networkErrorStore } from '../../lib/networkErrorStore';
import { colors, spacing } from '../../lib/theme';

interface Props {
  onRetry: () => void;
}

export default function ServerErrorScreen({ onRetry }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  // Animation de pulsation sur l'icône
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const handleRetry = () => {
    networkErrorStore.hide();
    onRetry();
  };

  return (
    <View style={styles.overlay}>
      <Card style={styles.card}>
        <Animated.Text style={[styles.icon, { transform: [{ scale: pulse }] }]}>
          📡
        </Animated.Text>

        <Text style={styles.title}>Serveur inaccessible</Text>

        <Text style={styles.message}>
          Impossible de contacter le serveur.{'\n'}
          Vérifiez votre connexion ou que le serveur est démarré.
        </Text>

        <Button label="Réessayer" onPress={handleRetry} style={styles.button} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    alignItems: 'center',
    marginHorizontal: spacing.xl,
  },
  icon: { fontSize: 56, marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' },
  message: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  button: { width: 200 },
});
