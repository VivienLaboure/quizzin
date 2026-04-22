/**
 * Gère les erreurs serveur et envoie une réponse standardisée
 * @param {Error} err - Erreur capturée
 * @param {Object} res - Objet réponse Express
 */
function errorHandler(err, res) {
  console.error("✗ Erreur serveur :", err.message);
  
  // Envoyer une réponse d'erreur standardisée
  res.status(500).json({
    error: err.message || "Erreur serveur interne",
    // En production, ne pas envoyer la stack trace
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
}

module.exports = errorHandler;