import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  login: undefined;
  register: undefined;
  forgotPassword: undefined;
  home: undefined;
  themes: { userId: string };
  difficulty: { category: string; userId: string };
  quizzPage: { category: string; difficulty: number; userId: string };
  resultatsPage: { category: string; difficulty: number; score: number; userId: string };
};

// Typage générique si tu veux l'utiliser dans d'autres composants
export type ScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;