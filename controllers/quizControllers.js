
const errorHandler = require("../middleware/errorHandlers");
const Quiz = require("../models/Quiz");

exports.getQuizById = async (req, res, next) => {
  try {
    const { theme, difficulty } = req.params;

    const quizTheme = await Quiz.findOne({categorie: theme});
    if (!quizTheme) return res.status(404).json({ error: "Catégorie de questions non trouvée" });

    const quizDifficulty = quizTheme[difficulty];
    if(!quizDifficulty) return res.status(404).json({ error: "Niveau de difficulté non trouvé"});

    const question = quizDifficulty[Math.floor(Math.random() * quizDifficulty.length)];

    res.status(201).json(question);

  } catch (err) {
    next(err);
  }
};


exports.createQuiz = async (req, res) => {
  try {
    const quiz = new quiz(req.body); //flexible grâce à {strict: false}
    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    errorHandler(err, res);
  }
};