require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const quizRoutes = require("./routes/quizRoutes");
const scoreRoutes = require("./routes/scoreRoutes");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/quiz", quizRoutes);
app.use("/api/score", scoreRoutes);

const PORT = process.env.PORT || 5000; // Render fournit process.env.PORT

// --- Serveur ---
app.listen(PORT, () => console.log("Serveur démarré sur le port", PORT));
