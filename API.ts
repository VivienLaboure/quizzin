import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { networkErrorStore } from './lib/networkErrorStore';

const apiUrl = Constants.expoConfig?.extra?.API_URL;
const port = Constants.expoConfig?.extra?.PORT;
const BASE = port ? `${apiUrl}:${port}` : apiUrl;

const TIMEOUT_MS = 15000;

interface RequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: object | string;
    auth?: boolean;
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

    const opts: { method?: string; headers: Record<string, string>; body?: string } = {
        method: options.method,
        headers,
        body: options.body && typeof options.body === "object"
            ? JSON.stringify(options.body)
            : (options.body as string | undefined),
    };

    // Timeout via AbortController — évite les chargements infinis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(url, { ...opts, signal: controller.signal } as RequestInit);
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
    } finally {
        clearTimeout(timeoutId);
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
export const createProfile = (payload: object) =>
    request("/api/score/new", { method: "POST", body: payload });

export const getProfile = (id: string) =>
    request(`/api/score/${id}`, { method: "GET" });

export const setExperience = (id: string, experience: number) =>
    request(`/api/score/update/${id}/experience`, { method: "PATCH", body: { experience } });

export const updateScoreForTheme = (id: string, payload: object) =>
    request(`/api/score/update/${id}`, { method: "PUT", body: payload });

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

export const createQuiz = () =>
    request(`/api/quiz/create`, { method: "POST", auth: false });

export default { request };
