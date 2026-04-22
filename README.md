# Quizzin — Frontend

Application mobile de quiz développée avec [Expo](https://expo.dev) et React Native.

## Stack technique

- **Expo** / React Native
- **expo-router** (navigation basée sur les fichiers)
- **TypeScript**
- **TailwindCSS** (via NativeWind)

## Installation

```bash
npm install
```

## Lancer l'application

```bash
npx expo start
```

Puis ouvrir sur :
- Android (émulateur ou appareil physique via Expo Go)
- iOS (simulateur ou appareil physique via Expo Go)

## Configuration (`app.json`)

Les variables d'environnement sont définies dans `app.json` sous la clé `extra` :

| Variable   | Description                          | Défaut               |
|------------|--------------------------------------|----------------------|
| `API_URL`  | URL de base de l'API backend         | `http://localhost`   |
| `PORT`     | Port de l'API backend                | `5000`               |
| `MOCK`     | Utiliser les données JSON locales    | `false`              |
| `MOCK_URL` | Chemin vers le fichier JSON de mock  | `../api/quizzFR.json`|

Pour activer le mode mock (sans backend) :
```json
"MOCK": true
```

## Structure du projet

```
app/
  screens/       # Écrans de l'application
  styles/        # Feuilles de style
  assets/        # Images, icônes
api/             # Données JSON locales (mock)
interfaces/      # Types et interfaces TypeScript
lib/             # Fonctions utilitaires
API.ts           # Client HTTP vers le backend
```

## Navigation

```
home → themes → difficulty → quizzPage → resultatsPage
```

## Dépannage

**Erreur ADB (Android) :**
```bash
adb kill-server
adb start-server
```

**Réinitialiser le projet :**
```bash
npm run reset-project
```

Règles du jeu:

on choisit un thème puis une difficulté.

Le but est de répondre correctement à la question pour pouvoir passer à la question suivante. Si ce n'est pas la bonne réponse, la partie s'arrete et on affiche le score. On obtient de l'XP sur notre profil pour débloquer d'autres thèmes