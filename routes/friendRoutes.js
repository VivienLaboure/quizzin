const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const friendController = require("../controllers/friendControllers");

router.use(authMiddleware);

// GET    /api/friends/search?pseudo=xxx  — recherche d'utilisateurs
router.get("/search", friendController.searchUsers);

// GET    /api/friends/requests           — demandes reçues
router.get("/requests", friendController.getRequests);

// GET    /api/friends                    — liste amis + classement XP
router.get("/", friendController.getFriends);

// POST   /api/friends/request/:userId   — envoyer une demande
router.post("/request/:userId", friendController.sendRequest);

// PATCH  /api/friends/request/:userId/accept — accepter
router.patch("/request/:userId/accept", friendController.acceptRequest);

// DELETE /api/friends/request/:userId   — refuser une demande
router.delete("/request/:userId", friendController.declineRequest);

// DELETE /api/friends/:userId           — supprimer un ami
router.delete("/:userId", friendController.removeFriend);

module.exports = router;
