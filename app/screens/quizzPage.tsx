import { Ionicons } from '@expo/vector-icons';
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
import { getSeenIds, markSeen, resetSeen } from '../../lib/seenQuestions';
import { colors, gradients, radius, spacing, typography } from '../../lib/theme';
import { useWakeupHint } from '../../lib/useWakeupHint';

// Délai minimum d'affichage de l'explication après une bonne réponse, avant
// d'enchaîner sur la question suivante — laisse le temps de la lire plutôt
// que de disparaître aussitôt remplacée (voir checkAnswer).
const READING_DELAY_MS = 2600;

export default function QuizzPage() {
    const router = useRouter();
    const { progress, addXp, recordStreak } = useProgress();
    const [currentQuestion, setCurrentQuestion] = useState<IQuizz | null>(null);
    const [propositions, setPropositions] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [popupExplication, setPopupExplication] = useState(false);
    // Confirmation avant d'abandonner la partie en cours — le score de la
    // série en cours n'est crédité (addXp/recordStreak) qu'à l'arrivée sur
    // resultatsPage, donc quitter avant cet écran le perd réellement.
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    // Identifiants des questions déjà vues dans cette partie (évite les doublons)
    const [seenQuestions, setSeenQuestions] = useState<Set<string>>(new Set());

    // Réponse tapée par le joueur + son statut — pilotent le retour visuel
    // (vert/rouge) affiché avant d'enchaîner sur la question suivante, et
    // bloquent un second tap pendant la transition.
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'incorrect' | null>(null);
    // Échec réseau lors du chargement de la question suivante (après une
    // bonne réponse) — la question précédente reste affichée, ce message
    // explique juste pourquoi rien n'a changé.
    const [loadError, setLoadError] = useState(false);

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

    // Récupère la prochaine question (API ou mock) en évitant les doublons —
    // ne touche à AUCUN état d'affichage (ni la question courante, ni
    // l'animation) : à l'appelant de décider quand l'appliquer. Séparé de
    // loadQuestion volontairement : avant, la question suivante n'était
    // demandée qu'APRÈS le début du fondu de sortie, donc tant que la
    // requête réseau n'avait pas répondu (souvent plusieurs secondes sur
    // mobile, parfois avec plusieurs essais en cas de doublon), la zone de
    // question restait invisible — d'où l'écran blanc pendant la partie.
    const getNextQuestion = async (seen: Set<string> = seenQuestions): Promise<IQuizz | null> => {
        if (Constants.expoConfig?.extra?.MOCK) {
            // Mode mock : on avance dans la file locale (déjà mélangée, pas de doublon)
            const quizzList = mockQueue.length > 0
                ? mockQueue
                : GetRandomQuizz(data as IData, safeCategory, safeDifficulty, 20);

            if (mockQueue.length === 0) setMockQueue(quizzList);

            const nextIndex = mockQueue.length === 0 ? 0 : mockIndex;
            if (nextIndex < quizzList.length) {
                setMockIndex(nextIndex + 1);
                return quizzList[nextIndex];
            }
            return null;
        }

        const MAX_RETRIES = 5;
        let attempts = 0;

        while (attempts < MAX_RETRIES) {
            try {
                const raw = await getRandomQuizByTheme(safeCategory, safeDifficulty);
                const quizz: IQuizz = Array.isArray(raw) ? raw[0] : raw;

                // Identifiant unique : _id si disponible, sinon le texte de la question
                const uid = quizz._id ?? quizz.question;

                if (!seen.has(uid)) {
                    // Nouvelle question : on l'enregistre (en mémoire pour
                    // cette partie, et sur l'appareil pour les parties
                    // suivantes — voir lib/seenQuestions.ts) et on la renvoie
                    setSeenQuestions(new Set(seen).add(uid));
                    markSeen(safeCategory, safeDifficulty, uid);
                    return quizz;
                }

                // Doublon détecté : on réessaie
                attempts++;
                console.log(`Question déjà vue, nouvel essai (${attempts}/${MAX_RETRIES})`);
            } catch (error) {
                console.error("Erreur lors du chargement de la question :", error);
                return null;
            }
        }

        // Toutes les tentatives sont tombées sur une question déjà vue — le
        // pool de ce thème/difficulté est épuisé (parties précédentes
        // comprises). Plutôt que d'afficher une fausse erreur réseau, on
        // "rebat le paquet" pour cette combinaison et on retente une
        // dernière fois : ça ne peut alors plus échouer pour cette raison.
        console.warn("Pool de questions épuisé pour ce thème/difficulté — réinitialisation de l'historique");
        resetSeen(safeCategory, safeDifficulty);
        try {
            const raw = await getRandomQuizByTheme(safeCategory, safeDifficulty);
            const quizz: IQuizz = Array.isArray(raw) ? raw[0] : raw;
            const uid = quizz._id ?? quizz.question;
            setSeenQuestions(new Set([uid]));
            markSeen(safeCategory, safeDifficulty, uid);
            return quizz;
        } catch (error) {
            console.error("Erreur lors du chargement de la question :", error);
            return null;
        }
    };

    // Chargement de la première question au montage — rien à faire
    // disparaître à l'écran, donc pas besoin de passer par le fondu. On
    // récupère d'abord l'historique des questions déjà vues lors de parties
    // précédentes sur ce thème/difficulté (voir lib/seenQuestions.ts), sans
    // quoi "Rejouer" resservait souvent les mêmes questions qu'à l'essai
    // précédent — seenQuestions, local à ce composant, ne protégeait que
    // l'intérieur d'une seule partie.
    useEffect(() => {
        getSeenIds(safeCategory, safeDifficulty).then(persisted => {
            setSeenQuestions(persisted);
            getNextQuestion(persisted).then(next => { if (next) loadQuestion(next); });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            // Bonne réponse : surligné en vert, explication affichée le temps
            // de la lire, PUIS la question suivante. La requête réseau part
            // immédiatement en parallèle (voir getNextQuestion) pour ne
            // jamais laisser l'écran vide en cas de connexion lente — c'est
            // le délai de lecture ci-dessous (pas le réseau) qui fixe le
            // rythme dans le cas normal où la réponse arrive vite.
            setAnswerStatus('correct');
            setScore(prev => prev + 1);
            setLoadError(false);
            const fetchPromise = getNextQuestion();
            const readingDelay = new Promise<void>(resolve => setTimeout(resolve, READING_DELAY_MS));
            Promise.all([fetchPromise, readingDelay]).then(([next]) => {
                if (!next) {
                    // Échec réseau : la question actuelle reste affichée
                    // (avec son surlignage) plutôt que de disparaître sur
                    // un écran vide — on redonne la main pour réessayer.
                    setSelectedAnswer(null);
                    setAnswerStatus(null);
                    setLoadError(true);
                    return;
                }
                Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
                    loadQuestion(next);
                });
            });
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
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => setShowQuitConfirm(true)}
                        style={styles.quitButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="close" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.category}>{getThemeDisplayName(safeCategory)}</Text>
                </View>
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

                {/* Bonne réponse : explication affichée le temps de la lire
                    (voir READING_DELAY_MS) avant d'enchaîner — avant, l'app
                    passait directement à la question suivante sans jamais
                    expliquer pourquoi la réponse était la bonne. */}
                {answerStatus === 'correct' && (
                    <View style={styles.inlineExplanationBox}>
                        <Text style={styles.inlineExplanationText}>{currentQuestion.explication}</Text>
                    </View>
                )}
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

            {showQuitConfirm && (
                <View style={styles.overlay}>
                    <Card style={styles.popup}>
                        <Text style={styles.popupIcon}>⚠️</Text>
                        <Text style={styles.popupTitle}>Quitter la partie ?</Text>
                        <Text style={styles.popupExplication}>
                            Ta progression dans cette série (score et série en cours) sera perdue.
                        </Text>
                        <View style={styles.quitActions}>
                            <TouchableOpacity
                                onPress={() => setShowQuitConfirm(false)}
                                style={styles.cancelButton}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <Button
                                label="Quitter"
                                onPress={() => router.back()}
                                style={styles.quitConfirmButton}
                            />
                        </View>
                    </Card>
                </View>
            )}

            {loadError && (
                <TouchableOpacity onPress={() => setLoadError(false)} style={styles.toast}>
                    <Text style={styles.toastText}>
                        Impossible de charger la question suivante — retape ta réponse pour réessayer.
                    </Text>
                </TouchableOpacity>
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
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
    quitButton: {
        width: 30,
        height: 30,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    category: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 1 },
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
    inlineExplanationBox: {
        marginTop: spacing.md,
        backgroundColor: colors.successSoft,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    inlineExplanationText: {
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
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
    quitActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: radius.full,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: { color: colors.textSecondary, fontWeight: '700' },
    quitConfirmButton: { flex: 1 },
    toast: {
        position: 'absolute',
        bottom: spacing.xl,
        left: spacing.lg,
        right: spacing.lg,
        backgroundColor: colors.textPrimary,
        borderRadius: radius.full,
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
    },
    toastText: { color: colors.white, fontSize: 13, textAlign: 'center' },
});
