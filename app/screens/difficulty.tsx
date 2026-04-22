import { useLocalSearchParams, useRouter } from "expo-router";
import React from 'react'; // Manquant : React.FC requiert cet import
import { Text, TouchableOpacity, View } from 'react-native';
import { ScreenProps } from '../../interfaces/types';
import styles from '../styles/default';

type Props = ScreenProps<'difficulty'>;

const Difficulty: React.FC<Props> = () => {

    const router = useRouter();
    const { category, userId } = useLocalSearchParams();
    const safeCategory = Array.isArray(category) ? category[0] : category;
    const safeUserId = Array.isArray(userId) ? userId[0] : String(userId ?? '');

    return (
        <View style={styles.container}>
            <View style={styles.topBar} />
            <View style={styles.bottomBar} />

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.buttonBackText}>Retour</Text>
            </TouchableOpacity>

            <Text style={styles.textTitle}>{safeCategory}</Text>

            <TouchableOpacity style={styles.button}
                onPress={() => router.push({ pathname: "/screens/quizzPage", params: { category: safeCategory, difficulty: "1", userId: safeUserId } })}
            >
                <Text style={styles.buttonText}>Facile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}
                onPress={() => router.push({ pathname: "/screens/quizzPage", params: { category: safeCategory, difficulty: "2", userId: safeUserId } })}
            >
                <Text style={styles.buttonText}>Moyen</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}
                onPress={() => router.push({ pathname: "/screens/quizzPage", params: { category: safeCategory, difficulty: "3", userId: safeUserId } })}
            >
                <Text style={styles.buttonText}>Difficile</Text>
            </TouchableOpacity>
        </View>
    );
}

export default Difficulty;