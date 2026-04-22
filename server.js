require('dotenv').config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const quizRoutes = require("./routes/quizRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");

const app = express();

// ─── Sécurité ────────────────────────────────────────────────────────────────

// Headers HTTP de sécurité (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS : n'accepte que les origines connues
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));

// Nettoyage des inputs MongoDB (prévient l'injection NoSQL)
app.use(mongoSanitize());

// Rate limiting global — 100 requêtes / 15 min par IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessaie dans quelques minutes." },
}));

// Rate limiting strict sur les routes d'auth — 10 tentatives / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives, réessaie dans 15 minutes." },
});

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10kb" })); // Limite la taille des payloads

// ─── Connexion DB ─────────────────────────────────────────────────────────────

connectDB();

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/friends", friendRoutes);

// ─── Démarrage ────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Serveur démarré sur le port ${PORT}`);
  console.log(`  ${process.env.BASE_URL || 'http://localhost'}:${PORT}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Promesse rejetée non gérée:', reason);
});
