import { View, Text, TouchableOpacity } from "react-native";
import MyStyles from "../constants/MyStyles";
import scoresData from "../data/scores.json";


const ScoresList = ({ navigation }: { navigation: any }) => {

    return (
        <View style={MyStyles.containerCenter}>
            <Text style={MyStyles.title}>Scores</Text>
            <Text>Score Histoire : {scoresData.Histoire}</Text>
            <Text>Score Géographie : {scoresData.Géographie}</Text>
            <TouchableOpacity
                style={MyStyles.button}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={MyStyles.buttonText} >Accueil</Text>
            </TouchableOpacity>
        </View>
    );
}
export default ScoresList;