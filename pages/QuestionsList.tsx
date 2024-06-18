import { View, Text, TouchableOpacity } from "react-native";
import MyStyles from "../constants/MyStyles";
import dataBase from "../data/dataQuestions.json";

const QuestionsList = ({ navigation }: { navigation: any }) => {

        return (
                <View style={MyStyles.container}>
                    {
                        Object.keys(dataBase).map((category, index) => {
                            return (
                                <TouchableOpacity
                                    style={MyStyles.button}
                                    key={index}
                                    onPress={() => navigation.navigate('QuizzPage', { category: category })}
                                >
                                    <Text style={MyStyles.buttonText}>{category}</Text>
                                </TouchableOpacity>
                            )
                        })
                            
                    }
                </View>
            );
}

export default QuestionsList;