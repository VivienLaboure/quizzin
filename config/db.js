const mongoose = require("mongoose");

/**
 * Établit la connexion à la base de données MongoDB Atlas
 * Arrête le serveur en cas d'erreur de connexion
 * Variables d'environnement requises:
 *  - MONGODB_USER: Utilisateur MongoDB Atlas
 *  - MONGODB_PASSWORD: Mot de passe MongoDB Atlas (URL-encoded si nécessaire)
 *  - MONGODB_CLUSTER: URL du cluster (ex: questions.8qjv0.mongodb.net)
 *  - MONGODB_COLLECTION: Nom de la base de données
 */
const connectDB = async () => {
    try {
        // Valider que toutes les variables requises sont définies
        const requiredVars = ['MONGODB_USER', 'MONGODB_PASSWORD', 'MONGODB_CLUSTER', 'MONGODB_COLLECTION'];
        const missingVars = requiredVars.filter(v => !process.env[v]);
        
        if (missingVars.length > 0) {
            throw new Error(`Variables d'environnement manquantes: ${missingVars.join(', ')}. Consultez .env.example`);
        }
        
        // Construire l'URI MongoDB
        const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_COLLECTION}?retryWrites=true&w=majority`;
        
        await mongoose.connect(uri);
        console.log("✓ Base de données connectée avec succès");
    } catch (err) {
        console.error("✗ Erreur connexion MongoDB :", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;