const mongoose = require("mongoose");
const PersonalScore = require("../models/PersonalScore");
const errorHandler = require("../middleware/errorHandlers");

/**
 * Valide les données d'un nouvel utilisateur
 * @param {string} userName - Nom d'utilisateur
 * @param {number} experience - Points d'expérience
 * @param {Array} scores - Tableau des scores
 * @returns {string|null} Message d'erreur ou null si valide
 */
const validateUserData = (userName, experience, scores) => {
  if (!userName || typeof userName !== "string" || userName.trim().length === 0) {
    return "Nom d'utilisateur invalide";
  }
  if (typeof experience !== "number" || experience < 0) {
    return "L'expérience doit être un nombre positif";
  }
  if (!Array.isArray(scores)) {
    return "Les scores doivent être un tableau";
  }
  return null;
};

/**
 * Crée un nouvel utilisateur avec ses scores initiaux
 * @param {Object} req - Requête Express
 * @param {Object} req.body - { userName, experience, scores }
 * @param {Object} res - Réponse Express
 */
exports.createScore = async (req, res) => {
  try {
    const { userName, experience, scores } = req.body;

    // Valider les données
    const validationError = validateUserData(userName, experience, scores);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Créer et sauvegarder le nouvel utilisateur
    const newScore = new PersonalScore({ userName, experience, scores });
    const savedScore = await newScore.save();
    
    res.status(201).json(savedScore);
  } catch (err) {
    errorHandler(err, res);
  }
};

/**
 * Récupère les scores d'un utilisateur par son ID
 * @param {Object} req - Requête Express
 * @param {string} req.params.id - ID MongoDB de l'utilisateur
 * @param {Object} res - Réponse Express
 */
exports.getScores = async (req, res) => {
  try {
    const { id } = req.params;

    // Valider que l'ID est un ObjectId MongoDB valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Format d'ID invalide" });
    }

    // Chercher l'utilisateur
    const user = await PersonalScore.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Code HTTP 200 pour une requête GET réussie
    res.status(200).json(user.scores);
  } catch (err) {
    errorHandler(err, res);
  }
};


/**
 * Met à jour les scores et l'expérience d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {string} req.params.id - ID de l'utilisateur
 * @param {Object} req.body - { experience, scores }
 * @param {Object} res - Réponse Express
 */
exports.updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { experience, scores } = req.body;

    // Valider l'ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Format d'ID invalide" });
    }

    // Valider les données
    const validationError = validateUserData("tempUser", experience, scores);
    if (validationError && !validationError.includes("Nom d'utilisateur")) {
      return res.status(400).json({ error: validationError });
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await PersonalScore.findByIdAndUpdate(
      id,
      { $set: { experience, scores } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    errorHandler(err, res);
  }
};


// Mettre à jour uniquement l’expérience
exports.updateExperience = async (req, res, next) => {
  try {

    const { id } = req.params;
    const { experience } = req.body;

    if (!id) return res.status(400).json({ error: "L'id doit être précisé" })

    const expValue = parseInt(experience, 10);
    if (isNaN(expValue)) {
      return res.status(400).json({ message: "La valeur d'experience doit être un nombre" })
    }

    const updated = await PersonalScore.findByIdAndUpdate(
      id,
      { $set: { experience: expValue } },
      { new: true, runValidators: true }      
    );

    if(!updated) return res.status(400).json({message: "Erreur lors de l'update"})

  res.json(updated);

} catch (err) {
  errorHandler(err, res);
}
};

