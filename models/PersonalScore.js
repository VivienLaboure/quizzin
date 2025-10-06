const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  userName: { type: String, required: true },     // nom ou pseudo
  experience: {type: Number, required: true},
  scores: [
    {
      theme: { type: String, required: true },   // thème du quiz
      highScore: { type: Number, required: true },   // score obtenu
      totalQuestions: { type: Number, required: true }, // total questions du quiz
    }
  ]
});

// Nom exact de la collection
module.exports = mongoose.model("PersonalScore", scoreSchema, "PersonalScore");
