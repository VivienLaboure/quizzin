
import { useNavigation } from '@react-navigation/native';
import { Text, View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { PageScreenNavigationProp } from '../interfaces/types';
import styles from '../styles/default';

const Home: React.FC = () => {
  const navigation = useNavigation<PageScreenNavigationProp<'themes'>>();

  return (
      <View style={[styles.container, { backgroundColor: 'white' }]}>
        

        <Image source={require('../assets/logo_text.png')} style={styles.image} />

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('themes')}
        >
          <Text style={styles.buttonText}>Jouer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
        >
          <Text style={styles.buttonText}>Paramètres</Text>
        </TouchableOpacity>

      </View>
  );
};

export default Home;
