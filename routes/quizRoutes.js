const express = require("express");
const quizController = require("../controllers/quizControllers");
const router = express.Router();

//GET /api/quizz/:theme/:difficulty/
router.get("/:theme/:difficulty", quizController.getRandomQuizByTheme);

router.get("/themes", quizController.getThemes);

router.post("/create", quizController.createQuiz);

module.exports = router;