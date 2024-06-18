import { View, Text, Button, Image, TouchableOpacity } from "react-native";
import MyStyles from "../constants/MyStyles";

const Home = ({ navigation }: { navigation: any }) => {

    return (
        <View style={MyStyles.container}>
            <TouchableOpacity
                onPress={() => navigation.navigate('QuestionsList')}
                style={MyStyles.button}
            >
                <Text style={MyStyles.buttonText}>Thèmes</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={MyStyles.button}
                onPress={() => navigation.navigate('ScoresList')}
            >
                <Text style={MyStyles.buttonText}>Scores</Text>
            </TouchableOpacity>
        </View>
    )
}
export default Home;