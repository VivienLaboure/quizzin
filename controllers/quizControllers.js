
const errorHandler = require("../middleware/errorHandlers");
const Quiz = require("../models/Quiz");

exports.getRandomQuizByTheme = async (req, res) => {
  try {
    const { theme, difficulty } = req.params;
    console.log(theme, difficulty);

    const quizTheme = await Quiz.findOne({categorie: theme});
    if (!quizTheme) return res.status(404).json({ error: "Catégorie de questions non trouvée" });

    const quizDifficulty = quizTheme[difficulty];
    if(!quizDifficulty) return res.status(404).json({ error: "Niveau de difficulté non trouvé"});

    const question = quizDifficulty[Math.floor(Math.random() * quizDifficulty.length)];

    res.status(201).json(question);

  } catch (err) {
    errorHandler(err, res);
  }
};

exports.getThemes = async (req, res) => {
  try {

    const quizTheme = await Quiz.find({}, {categorie:1, _id:0});

    res.status(201).json(quizTheme);

  } catch (err) {
    errorHandler(err, res);
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const quiz = new quiz(req.body);
    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    errorHandler(err, res);
  }
};