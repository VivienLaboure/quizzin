import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuestionsList from './pages/QuestionsList';
import Home from './pages/Home';
import Score from './pages/Score';
import QuizzPage from './pages/QuizzPage';
import ScoresList from './pages/ScoresList';

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="QuestionsList" component={QuestionsList} />
        <Stack.Screen name="QuizzPage" component={QuizzPage} options={{headerShown: false}}/>
        <Stack.Screen name="Score" component={Score} options={{headerShown: false}}/>
        <Stack.Screen name="ScoresList" component={ScoresList} options={{headerShown: false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
