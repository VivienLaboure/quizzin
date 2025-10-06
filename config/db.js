const mongoose = require("mongoose");

const connectDB = async => {

    // --- Connexion MongoDB ---
    const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@questions.8qjv0.mongodb.net/${process.env.COLLECTION}?retryWrites=true&w=majority`;

    mongoose.connect(uri)
        .then(() => console.log("Bdd connecté"))
        .catch(err => {
            console.error("Erreur connexion MongoDB :", err)
            process.exit(1); // arrêt du serveur si impossible de se connecter
        });
}

module.exports = connectDB;