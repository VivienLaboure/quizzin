import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { GetDifficultyName } from '../../lib/GetDifficultyName';
import { getLevel, getLevelProgress, getLevelThreshold } from '../../lib/LevelSystem';
import styles from '../styles/default';

export default function ResultatsPage() {
  const router = useRouter();
  const { category, difficulty, score, xpBefore, xpGained } = useLocalSearchParams();

  const safeCategory = Array.isArray(category) ? category[0] : String(category);
  const safeDifficulty = Number(Array.isArray(difficulty) ? difficulty[0] : difficulty);
  const safeScore = Number(Array.isArray(score) ? score[0] : score);
  const safeXpBefore = Number(Array.isArray(xpBefore) ? xpBefore[0] : xpBefore ?? 0);
  const safeXpGained = Number(Array.isArray(xpGained) ? xpGained[0] : xpGained ?? 0);
  const xpAfter = safeXpBefore + safeXpGained;

  const levelBefore = getLevel(safeXpBefore);
  const levelAfter = getLevel(xpAfter);
  const didLevelUp = levelAfter > levelBefore;

  const progressBefore = getLevelProgress(safeXpBefore);
  const progressAfter = getLevelProgress(xpAfter);

  // Niveau affiché (change après l'animation de level-up)
  const [displayLevel, setDisplayLevel] = useState(levelBefore);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Animated values
  const barAnim = useRef(new Animated.Value(progressBefore.progress)).current;
  const levelUpOpacity = useRef(new Animated.Value(0)).current;
  const xpLabelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (safeXpGained <= 0) return;

    // Petit délai avant de lancer l'animation
    const timeout = setTimeout(() => {
      if (!didLevelUp) {
        // Pas de level-up : simple remplissage de progressBefore → progressAfter
        Animated.timing(barAnim, {
          toValue: progressAfter.progress,
          duration: 900,
          useNativeDriver: false,
        }).start();
      } else {
        // Level-up : 1) remplir jusqu'à 100 %, 2) flash + changement de niveau, 3) remplir nouveau niveau
        Animated.timing(barAnim, {
          toValue: 1,
          duration: Math.round(600 * (1 - progressBefore.progress)),
          useNativeDriver: false,
        }).start(() => {
          setShowLevelUp(true);
          setDisplayLevel(levelAfter);

          Animated.sequence([
            Animated.timing(levelUpOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.delay(800),
            Animated.timing(levelUpOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start();

          // Réinitialiser la barre et remplir le niveau suivant
          barAnim.setValue(0);
          Animated.timing(barAnim, {
            toValue: progressAfter.progress,
            duration: 700,
            useNativeDriver: false,
          }).start();
        });
      }

      // Compteur "+N XP" qui monte
      Animated.timing(xpLabelAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // XP dans le niveau affiché
  const displayProgress = displayLevel === levelAfter ? progressAfter : progressBefore;

  return (
    <View style={styles.container}>
      <View style={styles.topBar} />

      <Text style={styles.textTitle}>Résultats</Text>
      <Text style={{ fontSize: 16, color: '#555', marginBottom: 4 }}>
        Catégorie : {safeCategory}
      </Text>
      <Text style={{ fontSize: 16, color: '#555', marginBottom: 4 }}>
        Difficulté : {GetDifficultyName(safeDifficulty)}
      </Text>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FF6347', marginBottom: 24 }}>
        {safeScore} bonne{safeScore > 1 ? 's' : ''} réponse{safeScore > 1 ? 's' : ''}
      </Text>

      {/* Bloc XP */}
      <View style={{
        width: '80%',
        backgroundColor: '#f9f9f9',
        borderRadius: 16,
        padding: 18,
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}>
        {/* Niveau + XP gagné */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{
            backgroundColor: '#FF6347',
            borderRadius: 12,
            paddingVertical: 4,
            paddingHorizontal: 12,
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
              Niv. {displayLevel}
            </Text>
          </View>

          {safeXpGained > 0 && (
            <Animated.Text style={{
              color: '#FF6347',
              fontWeight: 'bold',
              fontSize: 16,
              opacity: xpLabelAnim,
              transform: [{
                translateY: xpLabelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              }],
            }}>
              +{safeXpGained} XP
            </Animated.Text>
          )}
        </View>

        {/* Barre de progression */}
        <View style={{
          width: '100%',
          height: 14,
          backgroundColor: '#e0e0e0',
          borderRadius: 7,
          overflow: 'hidden',
          marginBottom: 6,
        }}>
          <Animated.View style={{
            width: barWidth,
            height: '100%',
            backgroundColor: '#FF6347',
            borderRadius: 7,
          }} />
        </View>

        <Text style={{ fontSize: 12, color: '#888', textAlign: 'right' }}>
          {displayProgress.currentXp} / {displayProgress.neededXp} XP
          {' '}(niveau suivant : {getLevelThreshold(displayLevel + 1)} XP)
        </Text>
      </View>

      {/* Banner level-up */}
      {showLevelUp && (
        <Animated.View style={{
          position: 'absolute',
          top: '28%',
          left: '10%',
          right: '10%',
          backgroundColor: '#FF6347',
          borderRadius: 16,
          paddingVertical: 18,
          paddingHorizontal: 24,
          alignItems: 'center',
          opacity: levelUpOpacity,
          shadowColor: '#FF6347',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
        }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
            NIVEAU {levelAfter} !
          </Text>
          <Text style={{ color: '#fff', fontSize: 14, marginTop: 4 }}>
            Bravo, tu as monté de niveau !
          </Text>
          {/* showLevelUp n'est activé que si le niveau a augmenté, donc cet écart est toujours > 0 ici */}
          <Text style={{ color: '#fff', fontSize: 14, marginTop: 8, fontWeight: 'bold' }}>
            🔑 +{levelAfter - levelBefore} jeton{levelAfter - levelBefore > 1 ? 's' : ''} de déblocage !
          </Text>
        </Animated.View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({ pathname: "/screens/home" })}
      >
        <Text style={styles.buttonText}>Retour à l&apos;accueil</Text>
      </TouchableOpacity>

      <View style={styles.bottomBar} />
    </View>
  );
}
