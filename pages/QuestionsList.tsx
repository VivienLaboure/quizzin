import { View, Text, Button } from "react-native";
import MyStyles from "../constants/MyStyles";
import { useNavigation } from "@react-navigation/native";


const QuestionsList = () => {
    const navigation = useNavigation();
    return (
        <View style={MyStyles.container}>
            <Text style={MyStyles.title}>Questions List</Text>
            <Button title="Start Quizz" onPress={() => navigation.navigate({ screen: 'QuizzPage' })} />
        </View>
    );
}

export default QuestionsList;