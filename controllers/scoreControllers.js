const mongoose = require("mongoose");
const PersonalScore = require("../models/PersonalScore");
const errorHandler = require("../middleware/errorHandlers");


exports.createScore = async (req, res) => {

  try {

    const { userName, experience, scores } = req.body;

    if (!userName || typeof experience !== "number" || !Array.isArray(scores)) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const newScore = new PersonalScore({ userName, experience, scores });
    const savedScore = await newScore.save();
    res.status(201).json(savedScore);
  } catch (err) {
    errorHandler(err, res);
  }

}

// Récupere le score de chaque thème
exports.getScores = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const user = await PersonalScore.findById(id);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    let result = user.scores;

    res.json(result);
  } catch (err) {
    errorHandler(err, res);
  }
};


// Modifie le score et l'experience
exports.updateScore = async (req, res) => {
  try {

    const { username, experience, score } = req.body;

    if (!username || typeof experience !== "Number" || !Array.isArray(score)) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const newScore = new PersonalScore({
      username,
      experience,
      score
    })

    const savedScore = await newScore.save();
    res.status(201).json(savedScore);
  }
  catch (err) {
    errorHandler(err, res)
  }
}


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

