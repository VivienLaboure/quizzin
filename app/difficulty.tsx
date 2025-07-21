import React from 'react';
import { View, Text, TouchableOpacity, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles/default';
import difficultyStyle from '../styles/difficultyStyles';
import { PageScreenNavigationProp } from '../interfaces/types';

export default function Difficulty(theme: any) {
    const navigation = useNavigation<PageScreenNavigationProp<'quizzPage'>>();

    return (
        <>
            <View style={styles.container}>
                <View style={styles.topBar}></View>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >

                    <Text style={styles.buttonBackText}>Retour</Text>
                </TouchableOpacity>

                <Text style={styles.textTitle}>
                    <Text>{theme.route.params.category}</Text>
                </Text>

                <TouchableOpacity style={styles.button}
                    onPress={() => navigation.navigate('quizzPage', { category: theme.route.params.category, difficulty: '1' })}
                >
                    <Text style={styles.buttonText}>Facile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button}
                    onPress={() => navigation.navigate('quizzPage', { category: theme.route.params.category, difficulty: '2' })}
                >
                    <Text style={styles.buttonText}>Moyen</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button}
                    onPress={() => navigation.navigate('quizzPage', { category: theme.route.params.category, difficulty: '3' })}
                >
                    <Text style={styles.buttonText}>Difficile</Text>
                </TouchableOpacity>
                <View style={styles.bottomBar}></View>
            </View>
        </>
    );
}
