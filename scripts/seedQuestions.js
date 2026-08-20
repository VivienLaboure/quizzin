require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Quiz = require("../models/Quiz");

const DATA_DIR = path.join(__dirname, "..", "data", "questions");
const VALID_DIFFICULTIES = ["1", "2", "3"];

/**
 * Normalise une question pour la comparaison de doublons.
 */
function normalize(text) {
  return String(text).trim().toLowerCase();
}

/**
 * Valide la forme d'une question. Retourne un message d'erreur ou null.
 */
function validateQuestion(q, theme, difficulty, index) {
  const where = `${theme}/${difficulty}[${index}]`;

  if (!q || typeof q !== "object") return `${where}: n'est pas un objet`;
  if (!q.question || typeof q.question !== "string") return `${where}: "question" manquant`;
  if (!q.reponse || typeof q.reponse !== "string") return `${where}: "reponse" manquant`;
  if (!Array.isArray(q.propositions) || q.propositions.length < 2) {
    return `${where}: "propositions" doit être un tableau d'au moins 2 éléments`;
  }
  if (!q.propositions.includes(q.reponse)) {
    return `${where}: "reponse" (${JSON.stringify(q.reponse)}) absente de "propositions"`;
  }
  const uniquePropositions = new Set(q.propositions.map(normalize));
  if (uniquePropositions.size !== q.propositions.length) {
    return `${where}: "propositions" contient des doublons`;
  }
  if (!q.explication || typeof q.explication !== "string") {
    return `${where}: "explication" manquante`;
  }
  return null;
}

/**
 * Charge tous les fichiers JSON de data/questions/.
 * Format attendu par fichier :
 * {
 *   "theme": "Culture-generale",
 *   "questions": {
 *     "1": [ { question, reponse, propositions[], explication }, ... ],
 *     "2": [...],
 *     "3": [...]
 *   }
 * }
 */
function loadQuestionFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`Aucun dossier ${DATA_DIR} — rien à importer.`);
    return [];
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
  const batches = [];

  for (const file of files) {
    const fullPath = path.join(DATA_DIR, file);
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    } catch (err) {
      throw new Error(`${file}: JSON invalide — ${err.message}`);
    }

    if (!parsed.theme || typeof parsed.theme !== "string") {
      throw new Error(`${file}: champ "theme" manquant`);
    }
    if (!parsed.questions || typeof parsed.questions !== "object") {
      throw new Error(`${file}: champ "questions" manquant`);
    }

    for (const difficulty of Object.keys(parsed.questions)) {
      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        throw new Error(`${file}: difficulté "${difficulty}" invalide (doit être 1, 2 ou 3)`);
      }
      const list = parsed.questions[difficulty];
      if (!Array.isArray(list)) {
        throw new Error(`${file}: questions.${difficulty} doit être un tableau`);
      }
      list.forEach((q, i) => {
        const error = validateQuestion(q, parsed.theme, difficulty, i);
        if (error) throw new Error(`${file}: ${error}`);
      });
    }

    batches.push({ file, theme: parsed.theme, questions: parsed.questions });
  }

  return batches;
}

async function seed() {
  const batches = loadQuestionFiles();
  if (batches.length === 0) return;

  await connectDB();

  // Le quiz vit dans un document unique et dynamique (voir models/Quiz.js).
  let doc = await Quiz.findOne({});
  if (!doc) {
    console.log("Aucun document 'theme' trouvé — création d'un nouveau document.");
    doc = new Quiz({});
  }

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const { file, theme, questions } of batches) {
    // doc.get()/doc.set() plutôt que doc[theme] = ... : sur un schéma
    // strict:false, l'assignation directe d'une clé top-level qui n'existe
    // pas encore sur le document ne persiste pas au save(), même avec
    // markModified() — Mongoose ne l'enregistre tout simplement pas comme un
    // chemin du document. doc.set() est la façon fiable d'ajouter un tout
    // nouveau thème (constaté en pratique : les thèmes déjà existants se
    // mettaient à jour correctement, mais un thème inédit disparaissait
    // silencieusement après doc.save()).
    const themeData = doc.get(theme) || {};

    for (const difficulty of Object.keys(questions)) {
      const existing = Array.isArray(themeData[difficulty]) ? themeData[difficulty] : [];
      const existingKeys = new Set(existing.map(q => normalize(q.question)));

      const incoming = questions[difficulty];
      const toAdd = incoming.filter(q => !existingKeys.has(normalize(q.question)));
      const skipped = incoming.length - toAdd.length;

      themeData[difficulty] = [...existing, ...toAdd];
      totalAdded += toAdd.length;
      totalSkipped += skipped;

      console.log(
        `✓ ${theme}/${difficulty} (${file}) : +${toAdd.length} ajoutée(s)` +
        (skipped > 0 ? `, ${skipped} déjà présente(s) (ignorée(s))` : "")
      );
    }

    doc.set(theme, themeData);
  }

  await doc.save();

  console.log(`\nTerminé : ${totalAdded} question(s) ajoutée(s), ${totalSkipped} doublon(s) ignoré(s).`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("✗ Échec de l'import :", err.message);
    process.exit(1);
  });
