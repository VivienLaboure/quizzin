import { Redirect } from 'expo-router';
import React from 'react';

/**
 * Point d'entrée réel de l'app — sans ce fichier, il n'y a AUCUNE route
 * enregistrée à "/", le chemin sur lequel démarre un vrai lancement natif
 * (contrairement au web, où on navigue toujours vers un chemin explicite
 * comme /screens/home). Voir git blame pour le détail du bug "Unmatched
 * Route" que ce fichier corrige.
 *
 * Plus aucune notion de compte/session à vérifier ici (progression stockée
 * localement, voir lib/ProgressContext.tsx) — la redirection est donc
 * inconditionnelle, contrairement à avant où elle dépendait d'un état de
 * connexion.
 */
export default function Index() {
  return <Redirect href="/screens/home" />;
}
