import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { getRandomQuizByTheme, setExperience } from '../../API';
import data from '../../api/quizzFR.json';
import { IData } from '../../interfaces/IData';
import { IQuizz } from '../../interfaces/IQuizz';
import { useAuth } from '../../lib/AuthContext';
import { GetRandomQuizz } from '../../lib/GetRandomQuizz';
import { computeXpGained } from '../../lib/LevelSystem';
import styles from '../styles/default';
import quizzPageStyle from '../styles/quizzPageStyle';

export default function QuizzPage() {
    const router = useRouter();
    const { user, updateXp } = useAuth();
    const [currentQuestion, setCurrentQuestion] = useState<IQuizz | null>(null);
    const [propositions, setPropositions] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [popupExplication, setPopupExplication] = useState(false);
    // Identifiants des questions déjà vues dans cette partie (évite les doublons)
    const [seenQuestions, setSeenQuestions] = useState<Set<string>>(new Set());

    // File de questions pour le mode mock (JSON local)
    const [mockQueue, setMockQueue] = useState<IQuizz[]>([]);
    const [mockIndex, setMockIndex] = useState(0);

    const { category, difficulty, userId } = useLocalSearchParams();
    const safeCategory = Array.isArray(category) ? category[0] : String(category);
    const safeDifficulty = Number(Array.isArray(difficulty) ? difficulty[0] : difficulty);
    const safeUserId = Array.isArray(userId) ? userId[0] : String(userId ?? '');

    function randomize(tab: string[]): string[] {
        // Fisher-Yates shuffle sur une copie pour ne pas muter l'original
        const shuffled = [...tab];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    const loadQuestion = (quizz: IQuizz) => {
        setCurrentQuestion(quizz);
        setPropositions(randomize(quizz.propositions));
        setPopupExplication(false);
    };

    // Récupère la prochaine question (API ou mock) en évitant les doublons
    const fetchNextQuestion = async (seen: Set<string> = seenQuestions) => {
        if (Constants.expoConfig?.extra?.MOCK) {
            // Mode mock : on avance dans la file locale (déjà mélangée, pas de doublon)
            const quizzList = mockQueue.length > 0
                ? mockQueue
                : GetRandomQuizz(data as IData, safeCategory, safeDifficulty, 20);

            if (mockQueue.length === 0) setMockQueue(quizzList);

            const nextIndex = mockQueue.length === 0 ? 0 : mockIndex;
            if (nextIndex < quizzList.length) {
                loadQuestion(quizzList[nextIndex]);
                setMockIndex(nextIndex + 1);
            }
        } else {
            const MAX_RETRIES = 5;
            let attempts = 0;

            while (attempts < MAX_RETRIES) {
                try {
                    const raw = await getRandomQuizByTheme(safeCategory, safeDifficulty);
                    const quizz: IQuizz = Array.isArray(raw) ? raw[0] : raw;

                    // Identifiant unique : _id si disponible, sinon le texte de la question
                    const uid = quizz._id ?? quizz.question;

                    if (!seen.has(uid)) {
                        // Nouvelle question : on l'enregistre et on l'affiche
                        const updated = new Set(seen).add(uid);
                        setSeenQuestions(updated);
                        loadQuestion(quizz);
                        return;
                    }

                    // Doublon détecté : on réessaie
                    attempts++;
                    console.log(`Question déjà vue, nouvel essai (${attempts}/${MAX_RETRIES})`);
                } catch (error) {
                    console.error("Erreur lors du chargement de la question :", error);
                    return;
                }
            }

            // Après MAX_RETRIES tentatives sans nouvelle question, on affiche quand même la dernière
            console.warn("Impossible de trouver une nouvelle question après plusieurs essais");
        }
    };

    // Chargement de la première question au montage
    useEffect(() => {
        fetchNextQuestion();
    }, []);

    const goToResults = async (finalScore: number) => {
        const xpBefore = user?.xp ?? 0;
        const xpGained = computeXpGained(finalScore, safeDifficulty);
        const newXp = xpBefore + xpGained;

        // Mise à jour de l'XP en BDD (valeur cumulée) + dans le contexte local
        if (safeUserId) {
            try {
                await setExperience(safeUserId, newXp);
                await updateXp(newXp);
            } catch (error) {
                console.error("Erreur mise à jour XP :", error);
            }
        }

        router.push({
            pathname: "/screens/resultatsPage",
            params: {
                category: safeCategory,
                difficulty: safeDifficulty,
                score: finalScore,
                userId: safeUserId,
                xpBefore,
                xpGained,
            },
        });
    };

    const checkAnswer = (answer: string) => {
        if (answer === currentQuestion?.reponse) {
            // Bonne réponse : on incrémente le score et on charge la question suivante
            setScore(prev => prev + 1);
            fetchNextQuestion();
        } else {
            // Mauvaise réponse : la partie s'arrête, on affiche l'explication
            setPopupExplication(true);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {!currentQuestion ? (
                <View style={styles.container}><Text>Chargement...</Text></View>
            ) : (
                <View style={styles.container}>
                    <View style={styles.topBar} />

                    <Text style={quizzPageStyle.title}>{currentQuestion.question}</Text>

                    {propositions.map((proposition, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => checkAnswer(proposition)}
                            style={quizzPageStyle.button}
                        >
                            <Text style={styles.buttonText}>{proposition}</Text>
                        </TouchableOpacity>
                    ))}

                    <View style={styles.bottomBar} />

                    {popupExplication && (
                        <View style={quizzPageStyle.popup}>
                            <Text style={styles.textTitle}>Mauvaise réponse !</Text>
                            <Text style={styles.textTitle}>{currentQuestion.explication}</Text>
                            <TouchableOpacity
                                onPress={() => goToResults(score)}
                                style={quizzPageStyle.buttonPopup}
                            >
                                <Text style={styles.buttonText}>Voir mon score</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
