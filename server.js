// Charger les variables d'environnement
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const quizRoutes = require("./routes/quizRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");

// Initialiser l'application Express
const app = express();

/**
 * Middleware
 */
app.use(cors()); // Activer CORS pour les requêtes cross-origin
app.use(express.json()); // Parser les requêtes JSON

/**
 * Connecter à la base de données MongoDB
 */
connectDB();

/**
 * Enregistrer les routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/friends", friendRoutes);

/**
 * Démarrer le serveur
 */
const PORT = process.env.PORT || 5000;


app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Serveur démarré sur le port ${PORT}`);
  console.log(`  ${process.env.BASE_URL || 'http://localhost'}:${PORT}`);
});

// Gérer les erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée non gérée:', reason);
});
