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

const isDev = process.env.NODE_ENV === "development";

// Render (comme la plupart des PaaS) place l'app derrière un reverse proxy.
// Sans ce réglage, req.ip retombe sur l'IP interne du proxy pour TOUTES les
// requêtes plutôt que la vraie IP du client — le rate limiter ci-dessous
// comptait alors tout le monde dans un seul et même compteur global au lieu
// d'un compteur par IP, ce qui déclenchait des 429 pour des utilisateurs qui
// n'avaient rien fait d'anormal. 1 = on fait confiance à un seul saut de
// proxy (celui de Render), pas plus.
app.set("trust proxy", 1);

// ─── Sécurité ────────────────────────────────────────────────────────────────

app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));

app.use(express.json({ limit: "10kb" }));

// Nettoyage NoSQL — après json() pour avoir accès à req.body
//
// On n'utilise pas mongoSanitize() directement : sa version 2.x fait
// `req.query = <objet nettoyé>`, or Express 5 expose req.query comme un
// getter sans setter ("Cannot set property query of #<IncomingMessage>
// which has only a getter") — ce qui plantait TOUTE requête passant par ce
// middleware. mongoSanitize.sanitize() nettoie l'objet passé en place (même
// référence), donc on l'appelle directement sur req.body/params/query sans
// jamais réassigner req.query.
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// Rate limiting global — 100 req / 15 min / IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessaie dans quelques minutes." },
  skip: (req) => req.method === "OPTIONS",
});

// Rate limiting strict sur les routes d'auth — 10 tentatives / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Trop de tentatives, réessaie dans 15 minutes." },
  skip: (req) => req.method === "OPTIONS",
});

app.use(globalLimiter);

// ─── Connexion DB ─────────────────────────────────────────────────────────────

connectDB();

// ─── Santé ────────────────────────────────────────────────────────────────────
// Route légère (pas d'accès DB) utilisée par le workflow GitHub Actions
// keep-alive.yml pour empêcher le service Render (plan gratuit) de se mettre
// en veille après 15 min d'inactivité.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/friends", friendRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

// ─── Gestionnaire d'erreurs global (Express 5) ───────────────────────────────
// Doit avoir exactement 4 paramètres pour être reconnu par Express

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("✗ Erreur non gérée :", err.message);

  // Payload trop grand (express.json limit)
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload trop volumineux" });
  }
  // JSON malformé
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON invalide" });
  }

  res.status(err.status || 500).json({
    error: isDev ? (err.message || "Erreur serveur interne") : "Erreur serveur interne",
    ...(isDev && { stack: err.stack }),
  });
});

// ─── Démarrage ────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Serveur démarré sur le port ${PORT}`);
  console.log(`  ${process.env.BASE_URL || 'http://localhost'}:${PORT}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Promesse rejetée non gérée:', reason);
});
