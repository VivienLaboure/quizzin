require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Quiz = require("./models/Quiz"); // <-- on importe le modèle ici

const app = express();
app.use(cors());
app.use(express.json());

// --- Connexion MongoDB ---
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@questions.8qjv0.mongodb.net/mongodbVSCodePlaygroundDB?retryWrites=true&w=majority`;

mongoose.connect(uri)
  .then(() => console.log("Bdd connecté"))
  .catch(err => console.error("Erreur connexion MongoDB :", err));

// --- Exemple de route ---
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

const PORT = process.env.PORT || 5000; // Render fournit process.env.PORT

// --- Serveur ---
app.listen(PORT, () => console.log("Serveur démarré sur le port", PORT));
