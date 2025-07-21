import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageScreenNavigationProp } from '../interfaces/types';
import Data from '../api/quizzFR.json';
import { IData } from '../interfaces/IData';
import styles from '../styles/default';
import themeStyle from '../styles/themesStyles';

export default function Themes() {

  const navigation = useNavigation<PageScreenNavigationProp<'difficulty'>>();

  const themeNames = Object.keys(Data);

  const [themes, setThemes] = useState<IData>();


  // Fonction pour récupérer le quizz aléatoire
  const fetchQuizz = async () => {
    setThemes(Data as IData);
  };

  useEffect(() => {
    // Appel asynchrone pour obtenir les questions de quizz au chargement du composant
    fetchQuizz();
  }, []);

  return (
    <>
      <View style={themeStyle.container}>
        <View style={styles.topBar}>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonBackText}>Retour</Text>
        </TouchableOpacity>

        {
          themeNames.map((themeNames, index) => {
            return (
              <TouchableOpacity
                style={styles.button}
                key={index}
                onPress={() => navigation.navigate('difficulty', { category: themeNames })}
              >
                <Text style={styles.buttonText}>
                  {themeNames}
                </Text>
              </TouchableOpacity>
            )
          })
        }
      </View>
      <View style={styles.bottomBar}>
      </View>
    </>
  );
}
