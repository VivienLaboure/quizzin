import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuestionsList from './pages/QuestionsList';
import Home from './pages/Home';
import Scores from './pages/Scores';
import QuizzPage from './pages/QuizzPage';

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="QuestionsList" component={QuestionsList} />
        <Stack.Screen name="Scores" component={Scores} />
        <Stack.Screen name="QuizzPage" component={QuizzPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
