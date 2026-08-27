import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../lib/theme';

/**
 * Barre d'onglets toujours visible — remplace l'ancien accueil "menu"
 * (Jouer / Amis / Statistiques / Se déconnecter empilés en boutons, chacun
 * poussant vers un écran séparé qu'il fallait quitter avec "retour" pour
 * changer de section). Les 4 destinations principales sont désormais des
 * pairs, pas une hiérarchie : on change de section en un tap, sans jamais
 * naviguer "en arrière".
 */
export default function TabsLayout() {
  // La hauteur/marge de la barre était fixe (64px), sans tenir compte de la
  // zone système en bas de l'écran (barre de navigation Android, geste ou 3
  // boutons ; à un degré moindre l'indicateur d'accueil iOS) — elle se
  // retrouvait donc au même endroit que le bouton "accueil" du système,
  // voire dessous. insets.bottom donne la hauteur réelle de cette zone (0
  // sur un appareil qui n'en a pas) : on l'ajoute à la hauteur de la barre
  // et à son padding pour qu'elle remonte au-dessus, quel que soit
  // l'appareil.
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="themes"
        options={{
          title: 'Thèmes',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'planet' : 'planet-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Amis',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
