const mongoose = require("mongoose");

/**
 * Schéma pour les scores d'un utilisateur par thème
 */
const scoreDetailSchema = {
  theme: { 
    type: String, 
    required: true,
    trim: true
  },
  highScore: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalQuestions: { 
    type: Number, 
    required: true,
    min: 1
  }
};

/**
 * Schéma principal pour les données d'un utilisateur
 */
const scoreSchema = new mongoose.Schema({
  // Nom ou pseudo de l'utilisateur
  userName: { 
    type: String, 
    required: true,
    trim: true,
    index: true // Index pour les recherches par nom d'utilisateur
  },
  // Points d'expérience accumulés
  experience: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  // Tableau des scores par thème
  scores: [scoreDetailSchema],
  // Thèmes débloqués — Culture-generale est le centre de l'étoile, toujours
  // débloqué par défaut. Les autres se débloquent avec un jeton.
  unlockedThemes: {
    type: [String],
    default: ["Culture-generale"],
  },
  // Jetons de déblocage disponibles, gagnés à chaque passage de niveau
  // (voir controllers/scoreControllers.js::updateExperience)
  unlockTokens: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Nom exact de la collection
module.exports = mongoose.model("PersonalScore", scoreSchema, "PersonalScore");
