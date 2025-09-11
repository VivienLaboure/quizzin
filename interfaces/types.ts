import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type PageScreenNavigationProp<RouteName extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList,
    RouteName
  >;

export type RootStackParamList = {
  home: undefined;
  themes: undefined;
  difficulty: { category: string };
  quizzPage: { category: string, difficulty: number };
  resultatsPage: { category: string, difficulty: number, score: number };
};