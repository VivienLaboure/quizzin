/**
 * Store minimaliste (pub/sub) pour signaler une session expirée/invalide
 * depuis API.ts (code non-React) vers AuthContext, sur le même principe que
 * networkErrorStore. Avant ce store, un token JWT expiré (au bout de
 * quelques heures) laissait l'utilisateur coincé sur un écran cassé — les
 * appels API échouaient en boucle avec un message d'erreur générique, sans
 * jamais le renvoyer vers l'écran de connexion.
 */

type Listener = () => void;

let listeners: Listener[] = [];
// Le login.tsx lit ce drapeau une seule fois au montage (consumeExpiredFlag)
// pour afficher un message explicite plutôt qu'une redirection silencieuse.
let _sessionExpired = false;

export const authErrorStore = {
  subscribe(fn: Listener) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
  triggerExpired() {
    _sessionExpired = true;
    listeners.forEach((l) => l());
  },
  /** Lit puis réinitialise le drapeau — à n'utiliser qu'une fois, au montage de l'écran de connexion. */
  consumeExpiredFlag() {
    const was = _sessionExpired;
    _sessionExpired = false;
    return was;
  },
};
