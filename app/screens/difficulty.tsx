import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from 'react-native';
import { ScreenProps } from '../../interfaces/types';
import styles from '../styles/default';

type Props = ScreenProps<'difficulty'>;

const Difficulty: React.FC<Props> = () => {

    const router = useRouter();
    const { category } = useLocalSearchParams();
    const safeCategory = Array.isArray(category) ? category[0] : category;
    return (
        <>
            <View style={styles.container}>
                <View style={styles.topBar}></View>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >

                    <Text style={styles.buttonBackText}>Retour</Text>
                </TouchableOpacity>

                <Text style={styles.textTitle}>
                    <Text>{safeCategory}</Text>
                </Text>

                <TouchableOpacity style={styles.button}
                    onPress={() => router.push({ pathname: "/screens/quizzPage", params: { category: safeCategory, difficulty: "1" } })}
                >
                    <Text style={styles.buttonText}>Facile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button}
                    onPress={() => router.push({ pathname: "/screens/quizzPage", params: { category: safeCategory, difficulty: "2" } })}
                >
                    <Text style={styles.buttonText}>Moyen</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button}
                    onPress={() => router.push({ pathname: "/screens/quizzPage", params: { category: safeCategory, difficulty: "3" } })}
                >
                    <Text style={styles.buttonText}>Difficile</Text>
                </TouchableOpacity>
                <View style={styles.bottomBar}></View>
            </View>
        </>
    );
}

export default Difficulty;