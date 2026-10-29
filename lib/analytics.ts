import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { LocalProgress } from './ProgressContext';

const DEVICE_ID_KEY = 'analytics_device_id';

const apiUrl = Constants.expoConfig?.extra?.API_URL;
const port = Constants.expoConfig?.extra?.PORT;
const BASE = port ? `${apiUrl}:${port}` : apiUrl;

function randomId(): string {
  // Pas besoin d'un vrai UUID cryptographique ici : deviceId ne sert qu'à
  // distinguer des appareils dans des statistiques d'usage anonymes, jamais
  // à authentifier quoi que ce soit.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

let deviceIdPromise: Promise<string> | null = null;

function getDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = AsyncStorage.getItem(DEVICE_ID_KEY).then(async existing => {
      if (existing) return existing;
      const id = randomId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
      return id;
    });
  }
  return deviceIdPromise;
}

// Télémétrie anonyme, best-effort : aucune erreur ici ne doit jamais remonter
// à l'utilisateur (pas de networkErrorStore, pas de throw) — voir
// lib/ProgressContext.tsx pour le point d'appel. Si BASE n'est pas configuré
// ou que la requête échoue (serveur endormi, hors-ligne...), on abandonne
// silencieusement : ce n'est que du reporting d'usage, pas une fonctionnalité
// du jeu.
export async function syncAnalytics(progress: LocalProgress): Promise<void> {
  if (!BASE) return;
  try {
    const deviceId = await getDeviceId();
    await fetch(`${BASE}/api/analytics/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, ...progress }),
    });
  } catch {
    // Silencieux par conception — voir commentaire ci-dessus.
  }
}
