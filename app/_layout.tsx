import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { networkErrorStore } from '../lib/networkErrorStore';
import ServerErrorScreen from './screens/serverError';

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [networkError, setNetworkError] = useState(false);

  // Écoute les erreurs réseau émises par API.ts
  useEffect(() => {
    const unsubscribe = networkErrorStore.subscribe(setNetworkError);
    return unsubscribe;
  }, []);

  // Redirection auth
  useEffect(() => {
    if (isLoading) return;

    const currentPath = segments.join('/');
    const isAuthScreen =
      currentPath.includes('login') ||
      currentPath.includes('register') ||
      currentPath.includes('forgotPassword');

    if (!user && !isAuthScreen) {
      router.replace('/screens/login');
    } else if (user && isAuthScreen) {
      router.replace('/screens/home');
    }
  }, [user, isLoading, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {networkError && (
        <ServerErrorScreen onRetry={() => setNetworkError(false)} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
