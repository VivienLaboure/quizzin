import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles/default';

import { PageScreenNavigationProp } from '../interfaces/types';
const StyledTouchableOpacity = TouchableOpacity;

export default function ResultatsPage(params: any) {
  const navigation = useNavigation<PageScreenNavigationProp<'home'>>();
  const { category, difficulty, score } = params.route.params;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}></View>
      <Text style={styles.textTitle}>
        <Text style={styles.textTitle}>Résultats</Text>
      </Text>

      <Text>
        <Text style={styles.textTitle}>Catégorie : {category}</Text>
      </Text>

      <Text>
        <Text style={styles.textTitle}>Difficulté : {difficulty}</Text>
      </Text>

      <Text style={styles.textTitle}>
        <Text style={styles.textTitle}>Score : {score}</Text>
      </Text>

      <StyledTouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('home')}
      >
        <Text style={styles.buttonText}>Retour à l'accueil</Text>
      </StyledTouchableOpacity>
      <View style={styles.bottomBar}></View>
    </View>
  );
}
