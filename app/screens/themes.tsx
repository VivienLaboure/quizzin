import { IThemes } from '@/interfaces/IThemes';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { getThemes } from '../../API';
import themesData from '../../api/quizzThemesFR.json';
import { useAuth } from '../../lib/AuthContext';
import { getDifficultyForLevel, getLevel } from '../../lib/LevelSystem';
import { GetDifficultyName } from '../../lib/GetDifficultyName';
import styles from '../styles/default';
import themeStyle from '../styles/themesStyles';

const DIFFICULTY_COLOR: Record<number, string> = {
  1: '#4CAF50',
  2: '#FF9800',
  3: '#F44336',
};

const Themes: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams();
  const safeUserId = Array.isArray(userId) ? userId[0] : String(userId ?? '');
  const [themesList, setThemesList] = useState<string[]>([]);

  const playerLevel = getLevel(user?.xp ?? 0);
  const difficulty = getDifficultyForLevel(playerLevel);
  const difficultyName = GetDifficultyName(difficulty);
  const difficultyColor = DIFFICULTY_COLOR[difficulty];

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        if (Constants.expoConfig?.extra?.MOCK) {
          const names = (themesData as IThemes[]).map(t => t.categorie);
          setThemesList(names);
        } else {
          const data = await getThemes() as string[];
          setThemesList(data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des thèmes :", error);
        setThemesList([]);
      }
    };

    fetchThemes();
  }, []);

  return (
    <View style={themeStyle.container}>
      <View style={styles.topBar} />
      <View style={styles.bottomBar} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonBackText}>Retour</Text>
      </TouchableOpacity>

      {/* Indicateur de difficulté automatique */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        position: 'absolute',
        top: 120,
        alignSelf: 'center',
      }}>
        <View style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: difficultyColor,
        }} />
        <Text style={{ color: '#555', fontSize: 14 }}>
          Difficulté : <Text style={{ fontWeight: 'bold', color: difficultyColor }}>{difficultyName}</Text>
          {'  '}
          <Text style={{ color: '#aaa' }}>(niveau {playerLevel})</Text>
        </Text>
      </View>

      {themesList.map((theme) => (
        <TouchableOpacity
          style={styles.button}
          key={theme}
          onPress={() =>
            router.push({
              pathname: '/screens/quizzPage',
              params: { category: theme, difficulty: String(difficulty), userId: safeUserId },
            })
          }
        >
          <Text style={styles.buttonText}>{theme}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Themes;
