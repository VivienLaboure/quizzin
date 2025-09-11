const mongoose = require("mongoose");

// Modèle flexible pour accepter les clés "1", "2", "3", etc.
const quizSchema = new mongoose.Schema({
  categorie: String
}, { strict: false }); // strict: false permet d'accepter n'importe quelle clé supplémentaire

// Nom exact de la collection dans MongoDB
module.exports = mongoose.model("Quiz", quizSchema, "theme");