import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Stockage clé/valeur avec la même API que expo-secure-store, mais qui
 * fonctionne aussi sur le web.
 *
 * expo-secure-store n'a aucune implémentation web (son module natif est un
 * objet vide côté web — voir node_modules/expo-secure-store/.../ExpoSecureStore.web.js),
 * donc l'appeler directement sur web plante avec
 * "setValueWithKeyAsync is not a function". On bascule sur localStorage pour
 * le web : ce n'est pas chiffré comme SecureStore sur iOS/Android (aucun
 * stockage web ne l'est), mais ça reste le repli standard pour ce cas côté
 * Expo, et suffisant pour un token/profil utilisateur en développement.
 */

async function getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
}

async function setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
    }
    await SecureStore.setItemAsync(key, value);
}

async function deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
    }
    await SecureStore.deleteItemAsync(key);
}

export default { getItemAsync, setItemAsync, deleteItemAsync };
