import { useNavigation } from "@react-navigation/native";
import { View, Text, Button } from "react-native";
import MyStyles from "../constants/MyStyles";


const Home = () => {
    const navigation = useNavigation();
    return (
        <View style={MyStyles.container}>
            <Text style={MyStyles.title}>Welcome to the Quizz App</Text>
            <Button title="Start Quizz" onPress={() => navigation.navigate({ screen: 'QuestionsList' })} />
        </View>
    );
}

export default Home;