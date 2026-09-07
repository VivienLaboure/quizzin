import { Redirect } from 'expo-router';
import React from 'react';
import LoadingScreen from '../components/ui/LoadingScreen';
import { useAuth } from '../lib/AuthContext';

/**
 * Point d'entrée réel de l'app — sans ce fichier, il n'y a AUCUNE route
 * enregistrée à "/", le chemin sur lequel démarre un vrai lancement natif
 * (contrairement au web, où on navigue toujours vers un chemin explicite
 * comme /screens/home). Résultat mesuré : l'app tombait sur l'écran
 * "Unmatched Route" d'Expo Router au tout premier lancement, et la
 * redirection vers /screens/login dans app/_layout.tsx (un router.replace()
 * impératif dans un useEffect) ne se déclenchait jamais — il n'y avait
 * jamais eu de route valide établie depuis laquelle "remplacer".
 *
 * <Redirect> est le mécanisme déclaratif recommandé par Expo Router pour ce
 * cas précis : contrairement à router.replace() dans un effet, il garantit
 * une route valide dès le premier rendu.
 */
export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Redirect href={user ? '/screens/home' : '/screens/login'} />;
}
