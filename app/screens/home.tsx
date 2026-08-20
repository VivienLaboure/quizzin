import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import OnboardingOverlay from '../../components/OnboardingOverlay';
import { useAuth } from '../../lib/AuthContext';
import { getLevelProgress } from '../../lib/LevelSystem';
import SecureStore from '../../lib/secureStorage';
import styles from '../styles/default';

const TUTORIAL_SEEN_KEY = 'has_seen_tutorial';

const Home: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  const userId = user?.scoreId ?? '';
  const xpData = getLevelProgress(user?.xp ?? 0);

  // Tutoriel au tout premier lancement — jamais revu ensuite une fois passé.
  useEffect(() => {
    SecureStore.getItemAsync(TUTORIAL_SEEN_KEY).then(seen => {
      if (!seen) setShowTutorial(true);
    });
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    SecureStore.setItemAsync(TUTORIAL_SEEN_KEY, 'true');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/screens/login');
  };

  return (
    <View style={styles.container}>
      {showTutorial && <OnboardingOverlay onDone={dismissTutorial} />}

      <Image source={require('../assets/logo_text.png')} style={styles.image} />

      {user && (
        <View style={{ width: '80%', alignItems: 'center', marginBottom: 20 }}>
          {/* Pseudo + badge niveau */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 16, color: '#555' }}>
              Bonjour, {user.pseudo} !
            </Text>
            <View style={{
              backgroundColor: '#FF6347',
              borderRadius: 12,
              paddingVertical: 3,
              paddingHorizontal: 10,
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                Niv. {xpData.level}
              </Text>
            </View>
          </View>

          {/* Barre de progression XP */}
          <View style={{
            width: '100%',
            height: 10,
            backgroundColor: '#e0e0e0',
            borderRadius: 5,
            overflow: 'hidden',
            marginBottom: 4,
          }}>
            <View style={{
              width: `${Math.round(xpData.progress * 100)}%`,
              height: '100%',
              backgroundColor: '#FF6347',
              borderRadius: 5,
            }} />
          </View>

          <Text style={{ fontSize: 11, color: '#888' }}>
            {xpData.currentXp} / {xpData.neededXp} XP
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({ pathname: '/screens/themes', params: { userId } })}
      >
        <Text style={styles.buttonText}>Jouer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#5b9bd5', marginTop: 4 }]}
        onPress={() => router.push({ pathname: '/screens/friends' })}
      >
        <Text style={styles.buttonText}>Amis</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#aaa', marginTop: 4 }]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Home;
