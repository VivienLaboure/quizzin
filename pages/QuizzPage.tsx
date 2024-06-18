import { View, Text, Button, TouchableOpacity } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import MyStyles from "../constants/MyStyles";
import database from "../data/dataQuestions.json";

type DatabaseType = typeof database;

const QuizzPage = ({ navigation, route }: { navigation: any, route: any }) => {
    type Category = keyof DatabaseType;
    const category = route.params.category as Category;
    const [questions, setQuestions] = useState(() => (database as DatabaseType)[category].sort(() => Math.random() - 0.5));
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [question, setQuestion] = useState<string>(questions[0].question);
    const [proposals, setProposals] = useState<string[]>(questions[0].proposals.sort(() => Math.random() - 0.5));
    const [score, setScore] = useState(0);

    useEffect(() => {
        const shuffledQuestion = questions[currentQuestion].question;
        const shuffledProposals = questions[currentQuestion].proposals.sort(() => Math.random() - 0.5);
        setQuestion(shuffledQuestion);
        setProposals(shuffledProposals);
    }, [currentQuestion, questions]);

    const handleReponse = useCallback((answer: string) => {
        if (answer === questions[currentQuestion].answer) {
            setScore(prevScore => prevScore + 1);
        }
        if (currentQuestion + 1 < questions.length) {
            setCurrentQuestion(prevQuestion => prevQuestion + 1);
        } else {
            navigation.navigate('ScoresList', { category: route.params.category, score: score + (answer === questions[currentQuestion].answer ? 1 : 0) });
        }
    }, [currentQuestion, questions, score, navigation]);

    return (
        <View style={MyStyles.containerCenter}>
            <Text style={MyStyles.title}>{question}</Text>
            {
                proposals.map((proposal, index) => (
                    <TouchableOpacity
                        style={MyStyles.button}
                        key={index}
                        onPress={() => handleReponse(proposal)}
                    >
                        <Text style={MyStyles.buttonText}>{proposal}</Text>
                    </TouchableOpacity>
                ))
            }
            <Text>Score : {score}</Text>
        </View>
    );
}

export default QuizzPage;
