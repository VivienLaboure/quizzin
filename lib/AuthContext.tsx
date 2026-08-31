import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authErrorStore } from './authErrorStore';
import SecureStore from './secureStorage';

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
      } catch (error) {
        // Session corrompue OU accès au stockage sécurisé en échec (ex: un
        // souci natif spécifique à l'appareil) : on se rabat sur "pas de
        // session" (l'utilisateur devra se reconnecter) plutôt que de
        // planter, mais on log l'erreur — avant, elle était avalée en
        // silence, rendant impossible de diagnostiquer un problème de
        // persistance signalé sur un vrai appareil.
        console.error('Erreur lors du chargement de la session stockée :', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  // Un appel API authentifié qui échoue en 401 (token expiré/invalide)
  // signale ce store depuis API.ts — on nettoie la session locale ici ;
  // l'effet de redirection de app/_layout.tsx enverra automatiquement vers
  // /screens/login dès que `user` devient null, sans que l'utilisateur reste
  // coincé sur un écran cassé.
  useEffect(() => {
    const unsubscribe = authErrorStore.subscribe(() => {
      SecureStore.deleteItemAsync(TOKEN_KEY);
      SecureStore.deleteItemAsync(USER_KEY);
      setToken(null);
      setUser(null);
    });
    return unsubscribe;
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
