const express = require("express");
const { getQuizById } = require("../controllers/quizControllers");
const router = express.Router();

//GET /api/quizz/:theme/:difficulty/:question
router.get("/:theme/:difficulty", getQuizById);

module.exports = router;