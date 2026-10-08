import { useEffect, useState } from 'react';

const WAKEUP_HINT_DELAY_MS = 4000;

/**
 * Vrai si `loading` reste vrai plus de WAKEUP_HINT_DELAY_MS. Le backend est
 * hébergé sur le plan gratuit de Render, qui se met en veille après 15 min
 * d'inactivité — le réveil peut prendre jusqu'à 50s (voir API.ts,
 * RETRY_TIMEOUT_MS). Sans indice, l'utilisateur voit juste un spinner
 * silencieux pendant tout ce temps, ce qui donne l'impression que l'app a
 * planté plutôt que d'attendre normalement le réveil du serveur.
 */
export function useWakeupHint(loading: boolean): boolean {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowHint(false);
      return;
    }
    const timeoutId = setTimeout(() => setShowHint(true), WAKEUP_HINT_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [loading]);

  return showHint;
}
