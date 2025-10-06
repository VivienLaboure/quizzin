import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  home: undefined;
  themes: undefined;
  difficulty: { category: string };
  quizzPage: { category: string, difficulty: number };
  resultatsPage: { category: string, difficulty: number, score: number };
};

// Typage générique si tu veux l'utiliser dans d'autres composants
export type ScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;