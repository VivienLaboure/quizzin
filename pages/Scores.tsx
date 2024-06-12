import { View, Text } from "react-native";
import MyStyles from "../constants/MyStyles";
import scoresData from "../data/scores.json";


const Scores = () => {
    return (
        <View style={MyStyles.container}>
            <Text style={MyStyles.title}>Scores</Text>
            <Text>Score Histoire : {scoresData.Histoire}</Text>
            <Text>Score Géographie : {scoresData.Géographie}</Text>                
        </View>
    );
}
export default Scores;