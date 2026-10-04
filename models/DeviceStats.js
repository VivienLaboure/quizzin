const mongoose = require("mongoose");

/**
 * Instantané de la progression d'un appareil, à usage de télémétrie
 * uniquement (nombre d'utilisateurs actifs, répartition des scores...).
 *
 * L'app n'a plus de notion de compte (progression stockée localement sur
 * le téléphone — voir frontend_quizzin/lib/ProgressContext.tsx). deviceId
 * est un UUID aléatoire généré et conservé par l'app, jamais relié à une
 * identité réelle (pas d'email, pas de pseudo) : ce document ne permet pas
 * de savoir QUI joue, seulement combien d'appareils jouent et comment ils
 * progressent globalement.
 *
 * Un seul document par deviceId, remplacé (upsert) à chaque synchronisation
 * plutôt qu'un historique d'événements — suffisant pour des statistiques
 * d'ensemble, beaucoup plus léger qu'un journal complet.
 */
const deviceStatsSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  xp: {
    type: Number,
    default: 0,
    min: 0,
  },
  unlockTokens: {
    type: Number,
    default: 0,
    min: 0,
  },
  unlockedThemes: {
    type: [String],
    default: ["Culture-generale"],
  },
  // XP par thème — permet de savoir quels thèmes sont les plus joués.
  themeXp: {
    type: Map,
    of: Number,
    default: () => new Map(),
  },
  // Meilleure série de bonnes réponses par thème.
  bestStreak: {
    type: Map,
    of: Number,
    default: () => new Map(),
  },
  firstSeenAt: {
    type: Date,
    default: Date.now,
  },
}, {
  // lastSeenAt plutôt que le couple createdAt/updatedAt par défaut : c'est
  // la seule des deux dates qui a un sens ici (firstSeenAt, ci-dessus, est
  // déjà fixé une fois pour toutes à la création).
  timestamps: { createdAt: false, updatedAt: "lastSeenAt" },
});

module.exports = mongoose.model("DeviceStats", deviceStatsSchema, "DeviceStats");
