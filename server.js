require('dotenv').config();
const Quiz = require("./models/Quiz"); // <-- on importe le modèle ici
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- Connexion MongoDB ---
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@questions.8qjv0.mongodb.net/mongodbVSCodePlaygroundDB?retryWrites=true&w=majority`;

mongoose.connect(uri)
  .then(async () => {
    console.log("MongoDB connecté");

  })
  .catch(err => console.error("Erreur connexion MongoDB :", err));

// --- Routes ---

// Quiz par catégorie, difficulté et numéro de question
app.get("/quiz/:categorie/:difficulte/:numero", async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ categorie: req.params.categorie });
    if (!quiz) return res.status(404).json({ message: "Quiz non trouvé" });

    const niveau = quiz[req.params.difficulte];
    if (!niveau) return res.status(404).json({ message: "Niveau de difficulté non trouvé" });

    const index = parseInt(req.params.numero, 10);
    if (isNaN(index) || index < 0 || index >= niveau.length) 
      return res.status(404).json({ message: "Numéro de question invalide" });

    res.json(niveau[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(5000, () => console.log("Serveur démarré sur http://localhost:5000"));