import { GetDifficultyName } from '@/functions/GetDifficultyName';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from '../styles/default';

import { router, useLocalSearchParams } from 'expo-router';
const StyledTouchableOpacity = TouchableOpacity;

export default function ResultatsPage() {
  const { category, difficulty, score } = useLocalSearchParams();
    const rawCategory = Array.isArray(category) ? category[0] : category;
    const safeCategory = String(rawCategory);
    const rawDifficulty = Array.isArray(difficulty) ? difficulty[0] : difficulty;
    const safeDifficulty = Number(rawDifficulty);
    const rawScore = Array.isArray(score) ? score[0] : score;
    const safeScore = Number(rawScore);
       
  return (
    <View style={styles.container}>
      <View style={styles.topBar}></View>
      <Text style={styles.textTitle}>
        <Text style={styles.textTitle}>Résultats</Text>
      </Text>

      <Text>
        <Text style={styles.textTitle}>Catégorie : {safeCategory}</Text>
      </Text>

      <Text>
        <Text style={styles.textTitle}>Difficulté : {GetDifficultyName(safeDifficulty)}</Text>
      </Text>

      <Text style={styles.textTitle}>
        <Text style={styles.textTitle}>Score : {safeScore}</Text>
      </Text>

      <StyledTouchableOpacity
        style={styles.button}
        onPress={() => router.push({pathname:"/"})}
      >
        <Text style={styles.buttonText}>Retour à l'accueil</Text>
      </StyledTouchableOpacity>
      <View style={styles.bottomBar}></View>
    </View>
  );
}
