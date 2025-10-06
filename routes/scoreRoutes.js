const express = require("express");
const scoreController = require("../controllers/scoreControllers");
const router = express.Router();

// Créer un utilisateur
router.post("/new", scoreController.createScore);

// Récupérer les scores d’un utilisateur
router.get("/:id", scoreController.getScores);

// Mettre à jour un score
router.put("/update/:id", scoreController.updateScore);

// Mettre à jour uniquement l’expérience
router.patch("/update/:id/experience", scoreController.updateExperience);

module.exports = router;