import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Difficulty from './app/difficulty';
import Home from './app/index';
import QuizzPage from './app/quizzPage';
import ResultatsPage from './app/resultatsPage';
import Themes from './app/themes';
import { RootStackParamList } from './interfaces/types';

export default function App() {
  const Stack = createNativeStackNavigator<RootStackParamList>();
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="home">
        <Stack.Screen name="home" component={Home} options={{ headerShown: false }} />
        <Stack.Screen name="themes" component={Themes} options={{ headerShown: false }} />
        <Stack.Screen name="difficulty" component={Difficulty} options={{ headerShown: false }} />
        <Stack.Screen name="quizzPage" component={QuizzPage} options={{ headerShown: false }} />
        <Stack.Screen name="resultatsPage" component={ResultatsPage} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
