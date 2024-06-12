import { View, Text, Button } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import MyStyles from "../constants/MyStyles";
import database from "../data/dataQuestions.json";

type DatabaseType = typeof database;

const QuizzPage = ({ navigation, route }: { navigation: any, route: any }) => {
    type Category = keyof DatabaseType;
    const category = route.params.category as Category;
    const questions = (database as DatabaseType)[category].sort(() => Math.random() - 0.5);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [proposals, setProposals] = useState<string[]>([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const shuffledProposals = questions[currentQuestion].proposals.sort(() => Math.random() - 0.5);
        setProposals(shuffledProposals);
    }, [currentQuestion, questions]);

    const handleReponse = useCallback((answer: string) => {
        if (answer === questions[currentQuestion].answer) {
            setScore(prevScore => prevScore + 1);
        }
        if (currentQuestion + 1 < questions.length) {
            setCurrentQuestion(prevQuestion => prevQuestion + 1);
        } else {
            navigation.navigate('Scores', { category: route.params.category, score: score });
        }
    }, [currentQuestion, questions, score, navigation]);

    return (
        <View style={MyStyles.container}>
            <Text style={MyStyles.title}>Numéro : {currentQuestion + 1}</Text>
            <Text style={MyStyles.title}>{questions[currentQuestion].question}</Text>
            {
                proposals.map((proposal, index) => (
                    <Button
                        key={index}
                        title={proposal}
                        onPress={() => handleReponse(proposal)}
                    />
                ))
            }
            <Text>Score : {score}</Text>
            <Button
                title="Retour"
                onPress={() => navigation.goBack()}
            />
        </View>
    );
}

export default QuizzPage;
