const User = require("../models/User");
const PersonalScore = require("../models/PersonalScore");
const errorHandler = require("../middleware/errorHandlers");

// ─── Recherche d'utilisateurs ────────────────────────────────────────────────

/**
 * GET /api/friends/search?pseudo=xxx
 * Cherche des utilisateurs par pseudo (hors soi-même).
 * Retourne aussi si une demande est déjà envoyée / si déjà amis.
 */
exports.searchUsers = async (req, res) => {
  try {
    const { pseudo } = req.query;
    if (!pseudo || pseudo.trim().length < 2) {
      return res.status(400).json({ error: "Pseudo trop court (minimum 2 caractères)" });
    }

    const me = await User.findById(req.user.id).select("friends friendRequests");
    if (!me) return res.status(404).json({ error: "Utilisateur introuvable" });

    const myFriendIds = me.friends.map(id => id.toString());

    // Utilisateurs dont j'ai envoyé une demande = ceux qui m'ont dans leurs friendRequests
    const usersWithMyRequest = await User.find({
      friendRequests: req.user.id,
    }).select("_id");
    const pendingSentIds = usersWithMyRequest.map(u => u._id.toString());

    const users = await User.find({
      pseudo: { $regex: pseudo.trim(), $options: "i" },
      _id: { $ne: req.user.id },
      emailVerified: true,
    })
      .select("pseudo _id")
      .limit(15);

    const result = users.map(u => ({
      id: u._id,
      pseudo: u.pseudo,
      isFriend: myFriendIds.includes(u._id.toString()),
      requestSent: pendingSentIds.includes(u._id.toString()),
      requestReceived: me.friendRequests.map(id => id.toString()).includes(u._id.toString()),
    }));

    res.json(result);
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Envoyer une demande d'ami ────────────────────────────────────────────────

/**
 * POST /api/friends/request/:userId
 */
exports.sendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const fromId = req.user.id;

    if (userId === fromId) {
      return res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-même" });
    }

    const [me, target] = await Promise.all([
      User.findById(fromId).select("friends"),
      User.findById(userId).select("friends friendRequests"),
    ]);

    if (!target) return res.status(404).json({ error: "Utilisateur introuvable" });
    if (me.friends.map(id => id.toString()).includes(userId)) {
      return res.status(409).json({ error: "Vous êtes déjà amis" });
    }
    if (target.friendRequests.map(id => id.toString()).includes(fromId)) {
      return res.status(409).json({ error: "Demande déjà envoyée" });
    }

    target.friendRequests.push(fromId);
    await target.save();

    res.json({ message: "Demande d'ami envoyée" });
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Demandes reçues ─────────────────────────────────────────────────────────

/**
 * GET /api/friends/requests
 * Retourne la liste des demandes d'amis reçues (en attente).
 */
exports.getRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("friendRequests", "pseudo _id");
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const requests = user.friendRequests.map(u => ({ id: u._id, pseudo: u.pseudo }));
    res.json(requests);
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Accepter une demande ─────────────────────────────────────────────────────

/**
 * PATCH /api/friends/request/:userId/accept
 */
exports.acceptRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;

    const [me, other] = await Promise.all([
      User.findById(myId),
      User.findById(userId),
    ]);

    if (!other) return res.status(404).json({ error: "Utilisateur introuvable" });

    const hasRequest = me.friendRequests.map(id => id.toString()).includes(userId);
    if (!hasRequest) {
      return res.status(400).json({ error: "Aucune demande de cet utilisateur" });
    }

    // Retirer la demande et ajouter mutuellement en amis
    me.friendRequests = me.friendRequests.filter(id => id.toString() !== userId);
    if (!me.friends.map(id => id.toString()).includes(userId)) me.friends.push(userId);
    if (!other.friends.map(id => id.toString()).includes(myId)) other.friends.push(myId);

    await Promise.all([me.save(), other.save()]);

    res.json({ message: "Demande acceptée" });
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Refuser / annuler une demande ───────────────────────────────────────────

/**
 * DELETE /api/friends/request/:userId
 * Refuser une demande reçue (userId = celui qui a envoyé).
 */
exports.declineRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { friendRequests: userId },
    });

    res.json({ message: "Demande refusée" });
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Liste des amis avec XP ──────────────────────────────────────────────────

/**
 * GET /api/friends
 * Retourne la liste des amis avec leur XP (depuis PersonalScore).
 * Inclut aussi les infos du joueur courant pour le classement.
 */
exports.getFriends = async (req, res) => {
  try {
    const me = await User.findById(req.user.id)
      .populate("friends", "pseudo scoreId");
    if (!me) return res.status(404).json({ error: "Utilisateur introuvable" });

    const myScore = await PersonalScore.findById(me.scoreId).select("experience");

    const friendsWithXp = await Promise.all(
      me.friends.map(async f => {
        const score = await PersonalScore.findById(f.scoreId).select("experience");
        return { id: f._id, pseudo: f.pseudo, xp: score?.experience ?? 0 };
      })
    );

    // Inclure le joueur courant dans le classement
    const all = [
      { id: me._id, pseudo: me.pseudo, xp: myScore?.experience ?? 0, isMe: true },
      ...friendsWithXp.map(f => ({ ...f, isMe: false })),
    ].sort((a, b) => b.xp - a.xp);

    res.json(all);
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Supprimer un ami ─────────────────────────────────────────────────────────

/**
 * DELETE /api/friends/:userId
 */
exports.removeFriend = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;

    await Promise.all([
      User.findByIdAndUpdate(myId, { $pull: { friends: userId } }),
      User.findByIdAndUpdate(userId, { $pull: { friends: myId } }),
    ]);

    res.json({ message: "Ami supprimé" });
  } catch (err) {
    errorHandler(err, res);
  }
};
