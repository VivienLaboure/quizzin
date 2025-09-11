import { RouteProp } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import data from '../api/quizzFR.json';
import { GetRandomQuizz } from '../functions/GetRandomQuizz';
import { IData } from '../interfaces/IData';
import { IQuizz } from '../interfaces/IQuizz';
import { RootStackParamList } from '../interfaces/types';
import styles from '../styles/default';
import quizzPageStyle from '../styles/quizzPageStyle';

type QuizzPageRouteProp = RouteProp<RootStackParamList, 'quizzPage'>;

interface Props {
  route: QuizzPageRouteProp;
}

export default function QuizzPage() {
    const [question, setQuestion] = useState('');
    const [propositions, setPropositions] = useState<string[]>([]);
    const [reponse, setReponse] = useState('');
    const [explication, setExplication] = useState('');
    const [index, setIndex] = useState<number>(0);
    const [popupExplication, setPopupExplication] = useState(false);
    const [score, setScore] = useState(0);
    const [actualQuizz, setActualQuizz] = useState<IQuizz[]>([]); // Changement ici

    const { category, difficulty } = useLocalSearchParams();
    const rawCategory = Array.isArray(category) ? category[0] : category;
    const safeCategory = String(rawCategory);
    const rawDifficulty = Array.isArray(difficulty) ? difficulty[0] : difficulty;
    const safeDifficulty = Number(rawDifficulty);

    // Fonction pour récupérer le quizz aléatoire
    const fetchQuizz = async () => {
        const quizz = await GetRandomQuizz(data as IData, safeCategory, safeDifficulty, 5);
        setActualQuizz(quizz);
    };

    function randomize(tab: string[]) {
        // Fonction pour mélanger un tableau
        for (let i = tab.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // Génère un index aléatoire
            [tab[i], tab[j]] = [tab[j], tab[i]]; // Échange les éléments
        }
        return tab;
    }

    useEffect(() => {
        // Appel asynchrone pour obtenir les questions de quizz au chargement du composant
        fetchQuizz();
    }, []);

    useEffect(() => {
        if (actualQuizz.length > 0) {
            setQuestion(actualQuizz[index].question);
            setPropositions(randomize(actualQuizz[index].propositions)); // Mélange les propositions
            setReponse(actualQuizz[index].reponse);
            setExplication(actualQuizz[index].explication);
        }
    }, [actualQuizz, index]); // Surveillance de actualQuizz et index

    const getNextQuizz = () => {
        if (index < actualQuizz.length - 1) {
            setIndex(index + 1);
        } else {
            console.log("navigation vers resultat... "+safeCategory+safeDifficulty+score )
            router.push({pathname:"/resultatsPage", params: {category: safeCategory, difficulty: safeDifficulty, score: score} });
        }
    };

    const checkAnswer = (answer: string) => {
        if (answer === reponse) {
            setScore(score + 1);
            getNextQuizz();
        } else {
            setPopupExplication(true);
        }
    };

    return (
        <>
            {actualQuizz.length === 0 ? <Text>Loading...</Text> : (
                <>
                    <View style={styles.container}>
                        <View style={styles.topBar}></View>

                        <Text style={quizzPageStyle.title}>{question}</Text>
                        {propositions.map((proposition: string, i: number) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => checkAnswer(proposition)}
                                style={quizzPageStyle.button}
                            >
                                <Text style={styles.buttonText}>{proposition}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.bottomBar}></View>
                    </View>
                    {popupExplication && (
                        <View style={quizzPageStyle.popup}>
                            <Text style={styles.textTitle}>{explication}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setPopupExplication(false);
                                    getNextQuizz();
                                }}
                                style={quizzPageStyle.buttonPopup}
                            >
                                <Text style={styles.buttonText}>Compris</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </>
    );
}
