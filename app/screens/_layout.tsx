import { Stack } from 'expo-router';

export default function Layout() {
  // animation: aucune transition n'était configurée — les écrans se
  // remplaçaient instantanément (login → register, thèmes → quiz →
  // résultats...). slide_from_right est le comportement natif standard
  // (iOS/Android), géré nativement par react-native-screens : pas de coût
  // de perf, contrairement à une animation JS custom.
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
