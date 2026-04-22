const errorHandler = require("../middleware/errorHandlers");
const Quiz = require("../models/Quiz");

// Champs à exclure quand on liste les clés du document
const EXCLUDED_KEYS = new Set(["_id", "__v", "createdAt", "updatedAt"]);

/**
 * Récupère une question aléatoire d'une catégorie et d'une difficulté données
 * GET /api/quiz/:theme/:difficulty
 */
exports.getRandomQuizByTheme = async (req, res) => {
  try {
    const { theme, difficulty } = req.params;

    if (!["1", "2", "3"].includes(difficulty)) {
      return res.status(400).json({ error: "Niveau de difficulté invalide. Doit être 1, 2 ou 3" });
    }

    // .lean() retourne un objet JS brut — pas de problème avec les clés dynamiques
    const doc = await Quiz.findOne({ [theme]: { $exists: true } }).lean();
    if (!doc) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    const questions = doc[theme]?.[difficulty];
    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: "Aucune question trouvée pour ce niveau de difficulté" });
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    res.status(200).json(questions[randomIndex]);

  } catch (err) {
    errorHandler(err, res);
  }
};

/**
 * Récupère la liste de tous les thèmes disponibles
 * GET /api/quiz/themes
 */
exports.getThemes = async (req, res) => {
  try {
    // .lean() retourne l'objet MongoDB brut, Object.keys() fonctionne sur tous les champs
    const doc = await Quiz.findOne({}).lean();
    if (!doc) {
      return res.status(404).json({ error: "Aucun quiz trouvé" });
    }

    const themes = Object.keys(doc).filter(key => !EXCLUDED_KEYS.has(key));
    res.status(200).json(themes);

  } catch (err) {
    errorHandler(err, res);
  }
};
