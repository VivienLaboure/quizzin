const jwt = require("jsonwebtoken");

/**
 * Middleware de vérification du token JWT.
 * Ajoute req.user = { id, scoreId, pseudo } si le token est valide.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token d'authentification manquant" });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expirée, veuillez vous reconnecter" });
    }
    return res.status(401).json({ error: "Token invalide" });
  }
}

module.exports = authMiddleware;
