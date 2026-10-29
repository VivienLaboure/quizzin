import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'seen_questions_v1';

function bucketKey(theme: string, difficulty: number): string {
  return `${theme}|${difficulty}`;
}

async function readAll(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, string[]>): void {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

// Identifiants de questions déjà vues pour ce thème/difficulté, toutes
// parties précédentes confondues — le `seenQuestions` local à quizzPage.tsx
// ne protège que l'intérieur d'une seule partie : sans cet historique
// persistant, "Rejouer" repartait à zéro et resservait souvent les mêmes
// questions qu'à l'essai précédent, le pool par thème/difficulté étant
// limité (20 à 45 questions selon les thèmes).
export async function getSeenIds(theme: string, difficulty: number): Promise<Set<string>> {
  const all = await readAll();
  return new Set(all[bucketKey(theme, difficulty)] ?? []);
}

// Ajoute un identifiant à l'historique — fire-and-forget, jamais bloquant
// pour l'affichage de la question suivante.
export function markSeen(theme: string, difficulty: number, id: string): void {
  readAll().then(all => {
    const key = bucketKey(theme, difficulty);
    const list = all[key] ?? [];
    if (!list.includes(id)) {
      all[key] = [...list, id];
      writeAll(all);
    }
  });
}

// Repart de zéro pour ce thème/difficulté — appelé quand tout le pool de
// questions a déjà été vu lors de parties précédentes (le "paquet" est
// épuisé, on le rebat plutôt que d'afficher une fausse erreur réseau).
export function resetSeen(theme: string, difficulty: number): void {
  readAll().then(all => {
    delete all[bucketKey(theme, difficulty)];
    writeAll(all);
  });
}
