import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuestionsList from './pages/QuestionsList';
import Home from './pages/Home';

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="QuestionsList" component={QuestionsList} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


