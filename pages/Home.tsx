import { View, Text, Button, Image } from "react-native";
import MyStyles from "../constants/MyStyles";

const Home = ({ navigation }: { navigation: any }) => {

    return (
        //logo and title
        <View style={MyStyles.container}>
            <Button
                title="Liste des questions"
                onPress={() => navigation.navigate('QuestionsList')}
            />
            <Button
                title="Scores"
                onPress={() => navigation.navigate('Scores')}
            />
        </View>
    )
}
export default Home;