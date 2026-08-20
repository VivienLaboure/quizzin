import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { getProfile, getThemes, unlockTheme } from '../../API';
import mockData from '../../api/quizzFR.json';
import { IData } from '../../interfaces/IData';
import { useAuth } from '../../lib/AuthContext';
import { GetDifficultyName } from '../../lib/GetDifficultyName';
import { GetThemes } from '../../lib/GetRandomQuizz';
import { getDifficultyForLevel, getLevel } from '../../lib/LevelSystem';
import styles from '../styles/default';
import themeStyle from '../styles/themesStyles';

const DIFFICULTY_COLOR: Record<number, string> = {
  1: '#4CAF50',
  2: '#FF9800',
  3: '#F44336',
};

// Thème central de l'étoile — toujours débloqué, point de départ de la
// progression.
const CENTER_THEME = 'Culture-generale';

const CENTER_SIZE = 104;
const NODE_SIZE = 84;

const Themes: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams();
  const safeUserId = Array.isArray(userId) ? userId[0] : String(userId ?? '');
  const { width } = useWindowDimensions();

  const isMock = !!Constants.expoConfig?.extra?.MOCK;

  const [themesList, setThemesList] = useState<string[]>([]);
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>([CENTER_THEME]);
  const [unlockTokens, setUnlockTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  // Popup de confirmation de déblocage
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const playerLevel = getLevel(user?.xp ?? 0);
  const difficulty = getDifficultyForLevel(playerLevel);
  const difficultyName = GetDifficultyName(difficulty);
  const difficultyColor = DIFFICULTY_COLOR[difficulty];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isMock) {
        // Mode mock : pas de backend, pas de vrai système de jetons —
        // tous les thèmes sont accessibles pour pouvoir tester le quiz.
        const names = GetThemes(mockData as IData);
        setThemesList(names);
        setUnlockedThemes(names);
        setUnlockTokens(0);
      } else {
        const [names, profile] = await Promise.all([
          getThemes() as Promise<string[]>,
          safeUserId ? getProfile(safeUserId) : Promise.resolve(null),
        ]);
        setThemesList(names);
        if (profile) {
          setUnlockedThemes(profile.unlockedThemes ?? [CENTER_THEME]);
          setUnlockTokens(profile.unlockTokens ?? 0);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des thèmes :', error);
      setThemesList([]);
    } finally {
      setLoading(false);
    }
  }, [isMock, safeUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goToQuiz = (theme: string) => {
    router.push({
      pathname: '/screens/quizzPage',
      params: { category: theme, difficulty: String(difficulty), userId: safeUserId },
    });
  };

  const handleThemePress = (theme: string, isUnlocked: boolean) => {
    if (isUnlocked) {
      goToQuiz(theme);
      return;
    }
    if (unlockTokens < 1) {
      setFeedback('Pas de jeton disponible — monte de niveau pour en gagner !');
      return;
    }
    setPendingTheme(theme);
  };

  const confirmUnlock = async () => {
    if (!pendingTheme || !safeUserId) return;
    setUnlocking(true);
    try {
      const result = await unlockTheme(safeUserId, pendingTheme);
      setUnlockedThemes(result.unlockedThemes ?? [...unlockedThemes, pendingTheme]);
      setUnlockTokens(result.unlockTokens ?? Math.max(0, unlockTokens - 1));
      setFeedback(`${pendingTheme} débloqué !`);
      setPendingTheme(null);
    } catch (error: unknown) {
      setFeedback(error instanceof Error ? error.message : 'Erreur lors du déblocage');
    } finally {
      setUnlocking(false);
    }
  };

  // ─── Géométrie de l'étoile ───────────────────────────────────────────────
  const starSize = Math.min(width * 0.85, 340);
  const starCenter = starSize / 2;
  const radius = starSize / 2 - NODE_SIZE / 2 - 4;

  const outerThemes = themesList.filter(t => t !== CENTER_THEME);
  const hasCenter = themesList.includes(CENTER_THEME);
  const angleStep = outerThemes.length > 0 ? (2 * Math.PI) / outerThemes.length : 0;

  return (
    <View style={themeStyle.container}>
      <View style={styles.topBar} />
      <View style={styles.bottomBar} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
        marginTop: 60,
      }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: difficultyColor }} />
        <Text style={{ color: '#555', fontSize: 14 }}>
          Difficulté : <Text style={{ fontWeight: 'bold', color: difficultyColor }}>{difficultyName}</Text>
          {'  '}
          <Text style={{ color: '#aaa' }}>(niveau {playerLevel})</Text>
        </Text>
      </View>

      {/* Jetons de déblocage */}
      {!isMock && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
        }}>
          <Text style={{ fontSize: 20 }}>🔑</Text>
          <Text style={{ color: '#555', fontSize: 14 }}>
            <Text style={{ fontWeight: 'bold', color: '#FF6347' }}>{unlockTokens}</Text> jeton{unlockTokens !== 1 ? 's' : ''} de déblocage
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#FF6347" style={{ marginTop: 40 }} />
      ) : (
        <View style={{ width: starSize, height: starSize, marginTop: 24 }}>
          {/* Rayons reliant le centre à chaque thème */}
          {outerThemes.map((theme, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const isUnlocked = unlockedThemes.includes(theme);
            return (
              <View
                key={`line-${theme}`}
                style={{
                  position: 'absolute',
                  left: starCenter,
                  top: starCenter,
                  width: 0,
                  height: 0,
                  transform: [{ rotate: `${angle}rad` }],
                }}
              >
                <View style={{
                  position: 'absolute',
                  left: 0,
                  top: -1.5,
                  width: radius,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: isUnlocked ? '#FF6347' : '#e0e0e0',
                }} />
              </View>
            );
          })}

          {/* Thème central */}
          {hasCenter && (
            <TouchableOpacity
              onPress={() => goToQuiz(CENTER_THEME)}
              style={{
                position: 'absolute',
                left: starCenter - CENTER_SIZE / 2,
                top: starCenter - CENTER_SIZE / 2,
                width: CENTER_SIZE,
                height: CENTER_SIZE,
                borderRadius: CENTER_SIZE / 2,
                backgroundColor: '#FF6347',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>
                {CENTER_THEME}
              </Text>
            </TouchableOpacity>
          )}

          {/* Thèmes autour */}
          {outerThemes.map((theme, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const x = starCenter + radius * Math.cos(angle);
            const y = starCenter + radius * Math.sin(angle);
            const isUnlocked = unlockedThemes.includes(theme);

            return (
              <TouchableOpacity
                key={theme}
                onPress={() => handleThemePress(theme, isUnlocked)}
                style={{
                  position: 'absolute',
                  left: x - NODE_SIZE / 2,
                  top: y - NODE_SIZE / 2,
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  borderRadius: NODE_SIZE / 2,
                  backgroundColor: isUnlocked ? '#fff' : '#f0f0f0',
                  borderWidth: 2,
                  borderColor: isUnlocked ? '#FF6347' : '#ddd',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 6,
                }}
              >
                {!isUnlocked && (
                  <Text style={{ fontSize: 16, marginBottom: 2 }}>🔒</Text>
                )}
                <Text style={{
                  color: isUnlocked ? '#333' : '#aaa',
                  fontWeight: 'bold',
                  fontSize: 11,
                  textAlign: 'center',
                }}>
                  {theme}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Popup de confirmation de déblocage */}
      {pendingTheme && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            width: '80%',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 17, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
              Débloquer {pendingTheme} ?
            </Text>
            <Text style={{ color: '#888', marginBottom: 20, textAlign: 'center' }}>
              Cela consommera 1 jeton de déblocage.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setPendingTheme(null)}
                disabled={unlocking}
                style={{
                  backgroundColor: '#f0f0f0',
                  borderRadius: 50,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                }}
              >
                <Text style={{ color: '#555', fontWeight: 'bold' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmUnlock}
                disabled={unlocking}
                style={[styles.button, { marginBottom: 0, opacity: unlocking ? 0.6 : 1 }]}
              >
                {unlocking
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Débloquer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Message de feedback (succès ou erreur de déblocage) */}
      {feedback && (
        <TouchableOpacity
          onPress={() => setFeedback(null)}
          style={{
            position: 'absolute',
            bottom: 80,
            alignSelf: 'center',
            backgroundColor: '#333',
            borderRadius: 20,
            paddingVertical: 10,
            paddingHorizontal: 20,
            maxWidth: '85%',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, textAlign: 'center' }}>{feedback}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Themes;
