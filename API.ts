import Constants from 'expo-constants';
import { networkErrorStore } from './lib/networkErrorStore';
import SecureStore from './lib/secureStorage';

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
    auth?: boolean;
}

async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...opts, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function request(path: string, options: RequestOptions = {}) {
    const url = `${BASE}${path}`;
    console.log("Full URL API Request:", url);

    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (options.auth !== false) {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

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

// ─── API Auth ─────────────────────────────────────────────────────────────────
export const registerUser = (payload: { pseudo: string; email: string; password: string }) =>
    request("/api/auth/register", { method: "POST", body: payload, auth: false });

export const verifyEmailCode = (payload: { email: string; code: string }) =>
    request("/api/auth/verify-email", { method: "POST", body: payload, auth: false });

export const loginUser = (payload: { email: string; password: string }) =>
    request("/api/auth/login", { method: "POST", body: payload, auth: false });

export const forgotPassword = (payload: { email: string }) =>
    request("/api/auth/forgot-password", { method: "POST", body: payload, auth: false });

export const resetPassword = (payload: { email: string; code: string; newPassword: string }) =>
    request("/api/auth/reset-password", { method: "POST", body: payload, auth: false });

// ─── API Score (token JWT injecté automatiquement) ───────────────────────────
export const getProfile = (id: string) =>
    request(`/api/score/${id}`, { method: "GET" });

export const setExperience = (id: string, xpGained: number, theme: string) =>
    request(`/api/score/update/${id}/experience`, { method: "PATCH", body: { xpGained, theme } });

export const updateScoreForTheme = (id: string, payload: object) =>
    request(`/api/score/update/${id}`, { method: "PUT", body: payload });

export const unlockTheme = (id: string, theme: string) =>
    request(`/api/score/update/${id}/unlock`, { method: "PATCH", body: { theme } });

// ─── API Amis ────────────────────────────────────────────────────────────────
export const searchUsers = (pseudo: string) =>
    request(`/api/friends/search?pseudo=${encodeURIComponent(pseudo)}`, { method: "GET" });

export const getFriends = () =>
    request("/api/friends", { method: "GET" });

export const getFriendRequests = () =>
    request("/api/friends/requests", { method: "GET" });

export const sendFriendRequest = (userId: string) =>
    request(`/api/friends/request/${userId}`, { method: "POST" });

export const acceptFriendRequest = (userId: string) =>
    request(`/api/friends/request/${userId}/accept`, { method: "PATCH" });

export const declineFriendRequest = (userId: string) =>
    request(`/api/friends/request/${userId}`, { method: "DELETE" });

export const removeFriend = (userId: string) =>
    request(`/api/friends/${userId}`, { method: "DELETE" });

// ─── API Quiz (public, pas de token requis) ───────────────────────────────────
export const getRandomQuizByTheme = (theme: string, difficulty: number) =>
    request(`/api/quiz/${theme}/${difficulty}`, { method: "GET", auth: false });

export const getThemes = () =>
    request(`/api/quiz/themes`, { method: "GET", auth: false });

export default { request };
