
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { ScreenProps } from '../../interfaces/types';
import styles from '../styles/default';
type Props = ScreenProps<'home'>;

const Home: React.FC<Props> = () => {

  const router = useRouter();

  return (
      <View style={styles.container}>

        <Image source={require('../assets/logo_text.png')} style={styles.image} />

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/screens/themes')}
        >
          <Text style={styles.buttonText}>Jouer</Text>
        </TouchableOpacity>

      </View>
  );
};

export default Home;
