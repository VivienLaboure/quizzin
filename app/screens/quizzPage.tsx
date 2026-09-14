import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getRandomQuizByTheme } from '../../API';
import data from '../../api/quizzFR.json';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { IData } from '../../interfaces/IData';
import { IQuizz } from '../../interfaces/IQuizz';
import { getThemeDisplayName } from '../../lib/getThemeDisplayName';
import { GetRandomQuizz } from '../../lib/GetRandomQuizz';
import { computeXpGained } from '../../lib/LevelSystem';
import { useProgress } from '../../lib/ProgressContext';
import { colors, gradients, radius, spacing, typography } from '../../lib/theme';
import { useWakeupHint } from '../../lib/useWakeupHint';

export default function QuizzPage() {
    const router = useRouter();
    const { progress, addXp, recordStreak } = useProgress();
    const [currentQuestion, setCurrentQuestion] = useState<IQuizz | null>(null);
    const [propositions, setPropositions] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [popupExplication, setPopupExplication] = useState(false);
    // Identifiants des questions déjà vues dans cette partie (évite les doublons)
    const [seenQuestions, setSeenQuestions] = useState<Set<string>>(new Set());

    // Réponse tapée par le joueur + son statut — pilotent le retour visuel
    // (vert/rouge) affiché avant d'enchaîner sur la question suivante, et
    // bloquent un second tap pendant la transition.
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'incorrect' | null>(null);

    // Anime l'apparition de chaque nouvelle question (fondu + léger
    // glissement) — avant, la question suivante remplaçait la précédente
    // instantanément, sans aucune transition.
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(14)).current;

    // File de questions pour le mode mock (JSON local)
    const [mockQueue, setMockQueue] = useState<IQuizz[]>([]);
    const [mockIndex, setMockIndex] = useState(0);

    const { category, difficulty } = useLocalSearchParams();
    const safeCategory = Array.isArray(category) ? category[0] : String(category);
    const safeDifficulty = Number(Array.isArray(difficulty) ? difficulty[0] : difficulty);

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
        // Remis à 0 de façon synchrone, avant même de changer la question :
        // au premier rendu de la nouvelle question, l'opacité est donc déjà
        // à 0 (pas de flash à l'ancienne valeur), puis l'effet ci-dessous
        // anime la remontée vers 1.
        fadeAnim.setValue(0);
        slideAnim.setValue(14);
        setCurrentQuestion(quizz);
        setPropositions(randomize(quizz.propositions));
        setPopupExplication(false);
        setSelectedAnswer(null);
        setAnswerStatus(null);
    };

    useEffect(() => {
        if (!currentQuestion) return;
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]).start();
    }, [currentQuestion, fadeAnim, slideAnim]);

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

    const goToResults = (finalScore: number) => {
        const xpBefore = progress.xp;
        const xpGained = computeXpGained(finalScore, safeDifficulty);

        // XP + record de série mis à jour localement (et persistés sur
        // l'appareil) — plus d'appel réseau ici, la progression n'a jamais
        // quitté le téléphone.
        addXp(safeCategory, xpGained);
        recordStreak(safeCategory, finalScore);

        router.push({
            pathname: "/screens/resultatsPage",
            params: {
                category: safeCategory,
                difficulty: safeDifficulty,
                score: finalScore,
                xpBefore,
                xpGained,
            },
        });
    };

    const checkAnswer = (answer: string) => {
        // Ignore un second tap pendant que le retour visuel/la transition
        // de la réponse précédente est encore en cours.
        if (selectedAnswer) return;
        setSelectedAnswer(answer);

        if (answer === currentQuestion?.reponse) {
            // Bonne réponse : surligné en vert un court instant avant de
            // s'effacer et d'enchaîner sur la question suivante — avant,
            // la question changeait sans aucun accusé de réception.
            setAnswerStatus('correct');
            setScore(prev => prev + 1);
            setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
                    fetchNextQuestion();
                });
            }, 500);
        } else {
            // Mauvaise réponse : surligne la réponse tapée en rouge et la
            // bonne en vert, laisse le temps de voir la différence, puis
            // affiche l'explication (la partie s'arrête).
            setAnswerStatus('incorrect');
            setTimeout(() => setPopupExplication(true), 500);
        }
    };

    const showWakeupHint = useWakeupHint(!currentQuestion);

    if (!currentQuestion) {
        // Seul appel réseau restant de l'app (récupérer une question) —
        // peut prendre jusqu'à une minute si le backend Render est en veille
        // (voir lib/useWakeupHint.ts) : sans cet indice, l'attente ressemble
        // à un blocage plutôt qu'à un réveil normal.
        return (
            <LoadingScreen
                message={showWakeupHint
                    ? "Le serveur se réveille — ça peut prendre jusqu'à une minute la première fois."
                    : "Préparation du quiz..."}
            />
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.category}>{getThemeDisplayName(safeCategory)}</Text>
                <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeText}>🔥 {score}</Text>
                </LinearGradient>
            </View>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <Text style={styles.question}>{currentQuestion.question}</Text>

                <View style={styles.answers}>
                    {propositions.map((proposition, i) => {
                        const isCorrectAnswer = proposition === currentQuestion.reponse;
                        const isTappedWrong = answerStatus === 'incorrect' && proposition === selectedAnswer;
                        const feedbackStyle =
                            answerStatus && isCorrectAnswer ? styles.answerCorrect :
                            isTappedWrong ? styles.answerIncorrect :
                            null;

                        return (
                            <TouchableOpacity
                                key={i}
                                onPress={() => checkAnswer(proposition)}
                                disabled={!!selectedAnswer}
                                style={[styles.answerButton, feedbackStyle]}
                            >
                                <Text style={styles.answerText}>{proposition}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.View>

            {popupExplication && (
                <View style={styles.overlay}>
                    <Card style={styles.popup}>
                        <Text style={styles.popupIcon}>😕</Text>
                        <Text style={styles.popupTitle}>Mauvaise réponse</Text>
                        <Text style={styles.popupExplication}>{currentQuestion.explication}</Text>
                        <Button label="Voir mon score" onPress={() => goToResults(score)} />
                    </Card>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 64,
        paddingHorizontal: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    category: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5 },
    scoreBadge: {
        borderRadius: radius.full,
        paddingVertical: 4,
        paddingHorizontal: spacing.sm + 2,
    },
    scoreBadgeText: { color: colors.white, fontWeight: '700', fontSize: 13 },
    question: {
        ...typography.h1,
        fontSize: 24,
        marginBottom: spacing.xl,
    },
    answers: { gap: spacing.sm },
    answerButton: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingVertical: 16,
        paddingHorizontal: spacing.md,
    },
    answerText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    answerCorrect: { backgroundColor: colors.successSoft, borderColor: colors.success },
    answerIncorrect: { backgroundColor: colors.errorSoft, borderColor: colors.error },
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popup: { width: '85%', alignItems: 'center' },
    popupIcon: { fontSize: 40, marginBottom: spacing.sm },
    popupTitle: { fontSize: 19, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
    popupExplication: {
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.lg,
    },
});
