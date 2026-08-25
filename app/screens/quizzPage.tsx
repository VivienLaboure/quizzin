import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getRandomQuizByTheme, setExperience } from '../../API';
import data from '../../api/quizzFR.json';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { IData } from '../../interfaces/IData';
import { IQuizz } from '../../interfaces/IQuizz';
import { useAuth } from '../../lib/AuthContext';
import { getThemeDisplayName } from '../../lib/getThemeDisplayName';
import { GetRandomQuizz } from '../../lib/GetRandomQuizz';
import { computeXpGained } from '../../lib/LevelSystem';
import { colors, gradients, radius, spacing, typography } from '../../lib/theme';

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

        // Mise à jour de l'XP en BDD — le serveur incrémente à la fois l'XP
        // globale (niveaux/jetons) et l'XP de ce thème (difficulté propre à
        // ce thème) à partir du delta gagné, pas d'une valeur absolue.
        if (safeUserId) {
            try {
                await setExperience(safeUserId, xpGained, safeCategory);
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

    if (!currentQuestion) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} />
            </View>
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

            <Text style={styles.question}>{currentQuestion.question}</Text>

            <View style={styles.answers}>
                {propositions.map((proposition, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => checkAnswer(proposition)}
                        style={styles.answerButton}
                    >
                        <Text style={styles.answerText}>{proposition}</Text>
                    </TouchableOpacity>
                ))}
            </View>

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
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
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
