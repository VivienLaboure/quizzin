import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Difficulty from './app/screens/difficulty';
import Home from './app/screens/home';
import QuizzPage from './app/screens/quizzPage';
import ResultatsPage from './app/screens/resultatsPage';
import Themes from './app/screens/themes';
import { RootStackParamList } from './interfaces/types';

const Stack = createNativeStackNavigator<RootStackParamList>();


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown:false}}>
        <Stack.Screen name="home" component={Home}/>
        <Stack.Screen name="themes" component={Themes}/>
        <Stack.Screen name="difficulty" component={Difficulty}/>
        <Stack.Screen name="quizzPage" component={QuizzPage}/>
        <Stack.Screen name="resultatsPage" component={ResultatsPage}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
