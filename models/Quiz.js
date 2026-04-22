const mongoose = require("mongoose");

/**
 * Le document en base a une structure dynamique :
 * {
 *   _id: ...,
 *   "Culture-generale": { 1: [...questions], 2: [...], 3: [...] },
 *   "Histoire":          { 1: [...], 2: [...], 3: [...] },
 *   ...
 * }
 * Les noms de catégories étant des clés dynamiques, on utilise strict: false.
 */
const quizSchema = new mongoose.Schema({}, {
  strict: false,
  collection: "theme"
});

module.exports = mongoose.model("Quiz", quizSchema);
