const express = require("express");
const quizController = require("../controllers/quizControllers");
const router = express.Router();

/**
 * Routes pour les quizzes
 */

// GET /api/quiz/themes - Récupérer tous les thèmes
router.get("/themes", quizController.getThemes);

// GET /api/quiz/:theme/:difficulty - Récupérer une question aléatoire
router.get("/:theme/:difficulty", quizController.getRandomQuizByTheme);


module.exports = router;