import { View, Text, Button } from "react-native";
import MyStyles from "../constants/MyStyles";
import { useNavigation } from "@react-navigation/native";

const QuizzPage = () => {
    const navigation = useNavigation();
    return (
        <View style={MyStyles.container}>
            <Text style={MyStyles.title}>Quizz Page</Text>
            <Button title="Go to Scores" onPress={() => navigation.navigate({ screen: 'Scores' })} />
        </View>
    );
}
export default QuizzPage;