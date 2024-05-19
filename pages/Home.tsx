import { View, Image, TouchableOpacity, Text } from 'react-native';

import styles from '../constants/MyStyles';

const Home = ({ navigation }: { navigation: any }) => {

    return (
        <View style={styles.container}>
            <Image style={styles.logo} source={require('../assets/img/logo.png')} resizeMode='contain' />
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('QuestionsList')}>
                <Text style={styles.buttonText}>Jouer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Scores</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Options</Text>
            </TouchableOpacity>
        </View>
    );
}





export default Home;