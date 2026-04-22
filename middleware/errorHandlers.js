/**
 * Gère les erreurs serveur et envoie une réponse standardisée
 * @param {Error} err - Erreur capturée
 * @param {Object} res - Objet réponse Express
 */
function errorHandler(err, res) {
  console.error("✗ Erreur serveur :", err.message);

  const isDev = process.env.NODE_ENV === "development";

  res.status(500).json({
    // En production : message générique — on ne fuite rien à l'attaquant
    error: isDev ? (err.message || "Erreur serveur interne") : "Erreur serveur interne",
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;