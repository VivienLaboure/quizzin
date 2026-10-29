import Constants from 'expo-constants';
import { networkErrorStore } from './lib/networkErrorStore';

const apiUrl = Constants.expoConfig?.extra?.API_URL;
const port = Constants.expoConfig?.extra?.PORT;
const BASE = port ? `${apiUrl}:${port}` : apiUrl;

// Le backend est hébergé sur le plan gratuit de Render, qui met le service en
// veille après 15 min d'inactivité — la requête qui le réveille peut prendre
// 30 à 50 s avant de répondre. TIMEOUT_MS reste court pour une UX réactive
// dans le cas normal (serveur déjà chaud) ; RETRY_TIMEOUT_MS ne sert que sur
// un premier abandon, pour absorber ce réveil sans pénaliser toutes les
// requêtes d'une longue attente systématique.
const TIMEOUT_MS = 15000;
const RETRY_TIMEOUT_MS = 45000;

interface RequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: object | string;
}

async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        // Sur certains environnements RN/Hermes, appeler abort() sans motif
        // explicite peut lever une erreur SYNCHRONE ("signal is aborted
        // without reason") — directement dans ce callback de setTimeout, donc
        // hors de portée du try/catch ci-dessous qui n'entoure que le fetch.
        // Non interceptée, elle remontait comme erreur globale non gérée au
        // tout premier appel réseau de l'app (typiquement l'écran des
        // thèmes), même quand la requête aboutissait normalement ensuite.
        // On fournit un motif explicite ET on intercepte par sécurité. Le
        // nom reste "AbortError" : fetch() rejette avec ce motif tel quel
        // (pas avec une DOMException générique) dès qu'on en fournit un, et
        // le code plus bas (retry + message utilisateur) distingue un abandon
        // par timeout d'une autre erreur via error.name === 'AbortError'.
        try {
            const reason = new Error('Timeout');
            reason.name = 'AbortError';
            controller.abort(reason);
        } catch {
            // Volontairement silencieux — voir commentaire ci-dessus.
        }
    }, timeoutMs);
    try {
        return await fetch(url, { ...opts, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

// Plus aucun endpoint appelé ici n'exige d'authentification — l'app n'a plus
// de notion de compte (progression stockée localement, voir
// lib/ProgressContext.tsx). Seuls les endpoints publics de quiz restent
// appelés côté backend.
async function request(path: string, options: RequestOptions = {}) {
    const url = `${BASE}${path}`;
    console.log("Full URL API Request:", url);

    const headers: Record<string, string> = { "Content-Type": "application/json", ...options.headers };

    const opts: RequestInit = {
        method: options.method,
        headers,
        body: options.body && typeof options.body === "object"
            ? JSON.stringify(options.body)
            : (options.body as string | undefined),
    };

    try {
        let res;
        try {
            res = await fetchWithTimeout(url, opts, TIMEOUT_MS);
        } catch (error) {
            // Premier abandon : probablement le serveur Render qui se réveille
            // plutôt qu'une vraie panne — on retente une fois avec plus de marge
            // avant d'afficher une erreur à l'utilisateur.
            if (error instanceof Error && error.name === 'AbortError') {
                res = await fetchWithTimeout(url, opts, RETRY_TIMEOUT_MS);
            } else {
                throw error;
            }
        }

        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();

        console.log("Response Status:", res.status);
        if (!res.ok) {
            const err = new Error(body?.error || body?.message || res.statusText) as Error & { status: number; body: unknown };
            err.status = res.status;
            err.body = body;
            throw err;
        }

        return body;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            networkErrorStore.show();
            throw new Error('Le serveur met trop de temps à répondre. Réessaie dans quelques instants.');
        }
        if (error instanceof TypeError) {
            networkErrorStore.show();
            throw new Error('Impossible de contacter le serveur. Vérifie ta connexion.');
        }
        console.error("API Error:", (error as Error).message);
        throw error;
    }
}

// ─── API Quiz (public, aucun compte requis) ───────────────────────────────
export const getRandomQuizByTheme = (theme: string, difficulty: number) =>
    request(`/api/quiz/${theme}/${difficulty}`, { method: "GET" });

export const getThemes = () =>
    request(`/api/quiz/themes`, { method: "GET" });

export default { request };
