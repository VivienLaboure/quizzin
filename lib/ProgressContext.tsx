import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getDifficultyForLevel, getLevel, getTokensForLevel } from './LevelSystem';
import { getThemeDisplayName } from './getThemeDisplayName';
import { getParent } from './themeTree';

const STORAGE_KEY = 'local_progress';
const CENTER_THEME = 'Culture-generale';

export interface LocalProgress {
  xp: number;
  unlockTokens: number;
  unlockedThemes: string[];
  // XP par thème — pilote la difficulté propre à ce thème, indépendamment
  // du niveau global (voir lib/LevelSystem.ts::getDifficultyForLevel).
  themeXp: Record<string, number>;
  // Meilleure série de bonnes réponses d'affilée par thème déjà joué — sert
  // à la fois de "record personnel" et à repérer le thème le plus faible
  // sur l'accueil (voir app/screens/(tabs)/home.tsx).
  bestStreak: Record<string, number>;
}

const DEFAULT_PROGRESS: LocalProgress = {
  xp: 0,
  unlockTokens: 0,
  unlockedThemes: [CENTER_THEME],
  themeXp: {},
  bestStreak: {},
};

interface ProgressContextType {
  progress: LocalProgress;
  isLoading: boolean;
  // Ajoute de l'XP gagnée sur un thème (global + propre au thème) et
  // attribue les jetons de déblocage correspondants en cas de passage de
  // niveau. Retourne le nombre de jetons gagnés par ce gain précis (pour
  // l'animation de résultats).
  addXp: (theme: string, xpGained: number) => number;
  // Enregistre un nouveau score (série de bonnes réponses) pour un thème —
  // ne réécrit que s'il s'agit d'un nouveau record.
  recordStreak: (theme: string, streak: number) => void;
  // Dépense 1 jeton pour débloquer un thème. Rejette (message lisible) si le
  // parent n'est pas débloqué ou qu'aucun jeton n'est disponible.
  unlockTheme: (theme: string) => Promise<{ unlockedThemes: string[]; unlockTokens: number }>;
  getThemeDifficulty: (theme: string) => number;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<LocalProgress>(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  // Miroir toujours à jour de `progress`, lu par les fonctions de mutation
  // ci-dessous : `progress` (le state React) ne reflète la dernière valeur
  // qu'après le prochain rendu, ce qui poserait problème si deux mutations
  // sont appelées coup sur coup dans le même gestionnaire (ex: addXp puis
  // recordStreak à la fin d'un quiz) — la seconde lirait alors un état
  // périmé si elle se basait sur `progress` directement.
  const progressRef = useRef(progress);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const parsed = JSON.parse(raw);
          // Compatibilité si des champs manquent (ancien format, install
          // fraîche...) — on complète avec les valeurs par défaut plutôt que
          // de planter sur un objet partiel.
          const merged: LocalProgress = { ...DEFAULT_PROGRESS, ...parsed };
          progressRef.current = merged;
          setProgress(merged);
        }
      })
      .catch(error => {
        console.error('Erreur lors du chargement de la progression locale :', error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = (next: LocalProgress) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(error => {
      console.error('Erreur lors de la sauvegarde de la progression locale :', error);
    });
  };

  // Applique une mise à jour immédiatement (via la ref, lue en synchrone),
  // programme le re-rendu et persiste en arrière-plan. Retourne le nouvel
  // état complet, pour que les fonctions publiques puissent en dériver leur
  // valeur de retour sans dépendre du prochain rendu React.
  const applyUpdate = useCallback((updater: (prev: LocalProgress) => LocalProgress): LocalProgress => {
    const next = updater(progressRef.current);
    progressRef.current = next;
    setProgress(next);
    persist(next);
    return next;
  }, []);

  const addXp = useCallback((theme: string, xpGained: number): number => {
    const prev = progressRef.current;
    const newXp = prev.xp + xpGained;
    const levelBefore = getLevel(prev.xp);
    const levelAfter = getLevel(newXp);
    const tokensEarned = Math.max(0, getTokensForLevel(levelAfter) - getTokensForLevel(levelBefore));

    applyUpdate(p => ({
      ...p,
      xp: newXp,
      themeXp: { ...p.themeXp, [theme]: (p.themeXp[theme] ?? 0) + xpGained },
      unlockTokens: p.unlockTokens + tokensEarned,
    }));

    return tokensEarned;
  }, [applyUpdate]);

  const recordStreak = useCallback((theme: string, streak: number) => {
    applyUpdate(p => {
      const best = p.bestStreak[theme] ?? 0;
      if (streak <= best) return p; // pas un record : pas de réécriture inutile
      return { ...p, bestStreak: { ...p.bestStreak, [theme]: streak } };
    });
  }, [applyUpdate]);

  const unlockTheme = useCallback(async (theme: string) => {
    const prev = progressRef.current;
    if (prev.unlockedThemes.includes(theme)) {
      throw new Error('Ce thème est déjà débloqué');
    }
    const parent = getParent(theme);
    if (parent && !prev.unlockedThemes.includes(parent)) {
      throw new Error(`Débloque d'abord "${getThemeDisplayName(parent)}"`);
    }
    if (prev.unlockTokens < 1) {
      throw new Error('Aucun jeton de déblocage disponible');
    }

    const next = applyUpdate(p => ({
      ...p,
      unlockedThemes: [...p.unlockedThemes, theme],
      unlockTokens: p.unlockTokens - 1,
    }));

    return { unlockedThemes: next.unlockedThemes, unlockTokens: next.unlockTokens };
  }, [applyUpdate]);

  const getThemeDifficulty = useCallback((theme: string) => {
    return getDifficultyForLevel(getLevel(progressRef.current.themeXp[theme] ?? 0));
  }, []);

  return (
    <ProgressContext.Provider value={{ progress, isLoading, addXp, recordStreak, unlockTheme, getThemeDifficulty }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextType {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress doit être utilisé dans un ProgressProvider');
  return ctx;
}
