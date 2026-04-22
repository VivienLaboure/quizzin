const express = require("express");
const scoreController = require("../controllers/scoreControllers");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Toutes les routes score sont protégées (données personnelles RGPD)
router.use(authMiddleware);

// POST /api/score/new - Créer un nouvel utilisateur avec ses scores
router.post("/new", scoreController.createScore);

// GET /api/score/:id - Récupérer les scores d'un utilisateur par son ID
router.get("/:id", scoreController.getScores);

// PUT /api/score/update/:id - Mettre à jour les scores et l'expérience d'un utilisateur
router.put("/update/:id", scoreController.updateScore);

// PATCH /api/score/update/:id/experience - Mettre à jour uniquement l'expérience
router.patch("/update/:id/experience", scoreController.updateExperience);

module.exports = router;