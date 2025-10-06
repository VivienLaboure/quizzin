import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, } from 'react-native';
import Data from '../../api/quizzFR.json';
import { IData } from '../../interfaces/IData';
import { ScreenProps } from '../../interfaces/types';
import styles from '../styles/default';
import themeStyle from '../styles/themesStyles';

type Props = ScreenProps<'themes'>;

const Themes: React.FC<Props> = () => {

  const router = useRouter();
  
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
          onPress={() => router.back()}>
          <Text style={styles.buttonBackText}>Retour</Text>
        </TouchableOpacity>

        {
          themeNames.map((themeNames, index) => {
            return (
              <TouchableOpacity
                style={styles.button}
                key={index}
                onPress={() => 
                  router.push({pathname:'/screens/difficulty', params: { category: themeNames }})}
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

export default Themes;