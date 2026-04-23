# Quizzin — Backend

API REST développée avec [Express](https://expressjs.com) et MongoDB Atlas.

## Stack technique

- **Node.js** / Express 5
- **MongoDB Atlas** / Mongoose
- **JWT** (authentification)
- **Nodemailer** (envoi d'emails)
- **helmet**, **express-rate-limit**, **express-mongo-sanitize** (sécurité)

## Installation

```bash
npm install
```

## Lancer le serveur

```bash
node server.js
```

## Configuration (`.env`)

Copier `.env.example` en `.env` et renseigner les variables :

| Variable           | Description                                 |
|--------------------|---------------------------------------------|
| `MONGODB_USER`     | Nom d'utilisateur MongoDB Atlas             |
| `MONGODB_PASSWORD` | Mot de passe MongoDB Atlas                  |
| `MONGODB_CLUSTER`  | URL du cluster Atlas                        |
| `MONGODB_COLLECTION` | Nom de la base de données                 |
| `PORT`             | Port du serveur (défaut : `5000`)           |
| `NODE_ENV`         | `development` ou `production`              |
| `JWT_SECRET`       | Clé secrète pour signer les tokens JWT      |
| `ALLOWED_ORIGINS`  | Origines CORS autorisées (séparées par `,`) |
| `MAIL_HOST`        | Serveur SMTP                                |
| `MAIL_PORT`        | Port SMTP (défaut : `587`)                  |
| `MAIL_SECURE`      | `true` pour TLS (port 465)                  |
| `MAIL_USER`        | Adresse email d'envoi                       |
| `MAIL_PASS`        | Mot de passe SMTP                           |

## Routes

### Auth — `/api/auth`

| Méthode | Chemin             | Description                              |
|---------|--------------------|------------------------------------------|
| POST    | `/register`        | Inscription (envoie un code par email)   |
| POST    | `/verify-email`    | Valide le code et active le compte       |
| POST    | `/login`           | Connexion (retourne un token JWT)        |
| POST    | `/forgot-password` | Envoie un code de réinitialisation       |
| POST    | `/reset-password`  | Réinitialise le mot de passe             |

### Quiz — `/api/quiz`

| Méthode | Chemin                   | Description                        |
|---------|--------------------------|------------------------------------|
| GET     | `/themes`                | Liste tous les thèmes disponibles  |
| GET     | `/:theme/:difficulty`    | Question aléatoire par thème       |

### Score — `/api/score` *(authentification requise)*

| Méthode | Chemin                       | Description                        |
|---------|------------------------------|------------------------------------|
| POST    | `/new`                       | Créer un profil de score           |
| GET     | `/:id`                       | Récupérer les scores d'un joueur   |
| PUT     | `/update/:id`                | Mettre à jour scores et XP         |
| PATCH   | `/update/:id/experience`     | Mettre à jour uniquement l'XP      |

### Amis — `/api/friends` *(authentification requise)*

| Méthode | Chemin                        | Description                         |
|---------|-------------------------------|-------------------------------------|
| GET     | `/`                           | Liste des amis avec leur XP         |
| GET     | `/search?pseudo=xxx`          | Rechercher des utilisateurs         |
| GET     | `/requests`                   | Demandes d'amis reçues              |
| POST    | `/request/:userId`            | Envoyer une demande d'ami           |
| PATCH   | `/request/:userId/accept`     | Accepter une demande d'ami          |
| DELETE  | `/request/:userId`            | Refuser une demande d'ami           |
| DELETE  | `/:userId`                    | Supprimer un ami                    |

## Structure du projet

```
config/        # Connexion MongoDB
controllers/   # Logique métier (auth, quiz, score, friends)
middleware/    # authMiddleware, errorHandlers
models/        # Schémas Mongoose (User, PersonalScore)
routes/        # Définition des routes Express
.github/
  workflows/   # Pipeline CI GitHub Actions
```

## CI/CD

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) se déclenche sur chaque push/PR vers `back-end-quizzin` et exécute :

1. `npm ci` — installation reproductible
2. `npm audit --audit-level=high` — vérification des vulnérabilités
3. `node --check` — vérification syntaxique des fichiers principaux

## Déploiement

L'API est déployée sur [Render](https://render.com).  
Commande de démarrage : `node server.js`
