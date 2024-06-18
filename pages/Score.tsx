import { View, Text, TouchableOpacity } from "react-native";
import MyStyles from "../constants/MyStyles";
import scoresData from "../data/scores.json";


const Scores = ({ navigation, route }: { navigation: any, route: any }) => {

    type Category = keyof typeof scoresData;
    const category = route.params.category as Category;

    if(route.params.score > scoresData[category]){
        scoresData[category] = route.params.score;
    }

    return (
        <View style={MyStyles.containerCenter}>
            <Text style={MyStyles.title}>Scores</Text>
            <Text>Score Histoire : {scoresData.Histoire}</Text>
            <Text>Score Géographie : {scoresData.Géographie}</Text>
            <Text>score actuel : {route.params.score}</Text>
            <Text>category actuel : {category}</Text>
            <TouchableOpacity
                style={MyStyles.button}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={MyStyles.buttonText} >Accueil</Text>
            </TouchableOpacity>
        </View>
    );
}
export default Scores;