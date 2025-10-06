function errorHandler(err, res) {
  console.error("Erreur serveur :", err.stack);
  res.status(500).json({ error: err.message || "Erreur serveur" });
}

module.exports = errorHandler;