/**
 * Store minimaliste (pub/sub) pour signaler une erreur réseau depuis API.ts
 * (code non-React) vers le layout React sans couplage direct.
 */

type Listener = (visible: boolean) => void;

let listeners: Listener[] = [];
let _visible = false;

export const networkErrorStore = {
  subscribe(fn: Listener) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
  show() {
    _visible = true;
    listeners.forEach((l) => l(true));
  },
  hide() {
    _visible = false;
    listeners.forEach((l) => l(false));
  },
  isVisible() {
    return _visible;
  },
};
