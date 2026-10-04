const express = require("express");
const analyticsController = require("../controllers/analyticsControllers");
const router = express.Router();

/**
 * Routes de télémétrie anonyme (pas de compte, pas d'authentification —
 * voir controllers/analyticsControllers.js).
 */

// POST /api/analytics/sync - Enregistre l'instantané de progression d'un appareil
router.post("/sync", analyticsController.syncDeviceStats);

module.exports = router;
