import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface AuthUser {
  id: string;
  pseudo: string;
  email: string;
  scoreId: string;
  xp: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  updateXp: (newXp: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la session stockée au démarrage
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (storedToken && storedUser) {
          const parsed = JSON.parse(storedUser);
          // Compatibilité avec les sessions sauvegardées sans xp
          if (parsed.xp === undefined) parsed.xp = 0;
          setToken(storedToken);
          setUser(parsed);
        }
      } catch {
        // Session corrompue : on ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = useCallback(async (newToken: string, newUser: AuthUser) => {
    const userWithXp: AuthUser = { ...newUser, xp: newUser.xp ?? 0 };
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userWithXp));
    setToken(newToken);
    setUser(userWithXp);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /** Met à jour l'XP localement et persiste dans SecureStore. */
  const updateXp = useCallback(async (newXp: number) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, xp: newXp };
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateXp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
