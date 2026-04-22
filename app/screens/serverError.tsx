import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { networkErrorStore } from '../../lib/networkErrorStore';

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
      <View style={styles.card}>
        <Animated.Text style={[styles.icon, { transform: [{ scale: pulse }] }]}>
          📡
        </Animated.Text>

        <Text style={styles.title}>Serveur inaccessible</Text>

        <Text style={styles.message}>
          Impossible de contacter le serveur.{'\n'}
          Vérifiez votre connexion ou que le serveur est démarré.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleRetry}>
          <Text style={styles.buttonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#FF6347',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
