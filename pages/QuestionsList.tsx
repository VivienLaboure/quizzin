import { View, Button } from "react-native";
import MyStyles from "../constants/MyStyles";
import dataBase from "../data/dataQuestions.json";

const QuestionsList = ({ navigation }: { navigation: any }) => {

        return (
                <View style={MyStyles.container}>
                    {
                        Object.keys(dataBase).map((category, index) => {
                            return (
                                <Button
                                    key={index}
                                    title={category}
                                    onPress={() => navigation.navigate('QuizzPage', { category: category })}
                                />
                            )
                        })
                            
                    }
                </View>
            );
}

export default QuestionsList;