import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type PageScreenNavigationProp<RouteName extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList,
    RouteName
  >;

export type RootStackParamList = {
  home: undefined;
  themes: undefined;
  difficulty: { category: string };
  quizzPage: { category: string, difficulty: string };
  resultatsPage: { category: string, difficulty: string, score: number };
};