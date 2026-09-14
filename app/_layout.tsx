import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import LoadingScreen from '../components/ui/LoadingScreen';
import { networkErrorStore } from '../lib/networkErrorStore';
import { ProgressProvider, useProgress } from '../lib/ProgressContext';
import ServerErrorScreen from './screens/serverError';

function RootNavigator() {
  const { isLoading } = useProgress();
  const [networkError, setNetworkError] = useState(false);

  // Écoute les erreurs réseau émises par API.ts
  useEffect(() => {
    const unsubscribe = networkErrorStore.subscribe(setNetworkError);
    return unsubscribe;
  }, []);

  // Avant : rien ne s'affichait pendant cette vérification (écran blanc, ou
  // un flash du mauvais écran juste avant la redirection) — c'est pourtant
  // la toute première chose vue à chaque ouverture de l'app.
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      {networkError && (
        <ServerErrorScreen onRetry={() => setNetworkError(false)} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <ProgressProvider>
      <RootNavigator />
    </ProgressProvider>
  );
}
