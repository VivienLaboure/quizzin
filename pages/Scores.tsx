import { View, Text, Button } from "react-native";
import MyStyles from "../constants/MyStyles";
import scoresData from "../data/scores.json";


const Scores = ({ navigation }: { navigation: any }) => {
    return (
        <View style={MyStyles.container}>
            <Text style={MyStyles.title}>Scores</Text>
            <Text>Score Histoire : {scoresData.Histoire}</Text>
            <Text>Score Géographie : {scoresData.Géographie}</Text>
            <Button
                title="Accueil"
                onPress={() => navigation.navigate('Home')}
            />
        </View>
    );
}
export default Scores;