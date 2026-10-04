const DeviceStats = require("../models/DeviceStats");
const errorHandler = require("../middleware/errorHandlers");
const { getLevel } = require("../lib/levelSystem");

/**
 * Enregistre un instantané anonyme de la progression d'un appareil.
 * POST /api/analytics/sync
 * Body : { deviceId, xp, unlockTokens, unlockedThemes, themeXp, bestStreak }
 *
 * Public et anonyme par construction : deviceId est généré côté app, sans
 * lien avec une identité réelle. Appelé en tâche de fond après chaque
 * modification de la progression locale (voir lib/ProgressContext.tsx côté
 * app) — un échec ici ne doit jamais bloquer ni avertir l'utilisateur,
 * c'est de la télémétrie, pas une fonctionnalité du jeu.
 */
exports.syncDeviceStats = async (req, res) => {
  try {
    const { deviceId, xp, unlockTokens, unlockedThemes, themeXp, bestStreak } = req.body;

    if (!deviceId || typeof deviceId !== "string" || deviceId.length > 100) {
      return res.status(400).json({ error: "deviceId invalide" });
    }
    if (typeof xp !== "number" || xp < 0) {
      return res.status(400).json({ error: "xp invalide" });
    }

    await DeviceStats.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          xp,
          unlockTokens: typeof unlockTokens === "number" ? unlockTokens : 0,
          unlockedThemes: Array.isArray(unlockedThemes) ? unlockedThemes : ["Culture-generale"],
          themeXp: themeXp && typeof themeXp === "object" ? themeXp : {},
          bestStreak: bestStreak && typeof bestStreak === "object" ? bestStreak : {},
        },
      },
      { upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    errorHandler(err, res);
  }
};

/**
 * Statistiques d'ensemble pour le propriétaire de l'app — protégé par une
 * clé secrète partagée (voir ADMIN_SECRET dans .env), passée en query
 * string : /api/admin/stats?key=...
 */
exports.getAdminStats = async (req, res) => {
  try {
    if (!process.env.ADMIN_SECRET || req.query.key !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const devices = await DeviceStats.find({}).sort({ lastSeenAt: -1 }).lean();

    const totalDevices = devices.length;
    const totalXp = devices.reduce((sum, d) => sum + (d.xp || 0), 0);
    const avgXp = totalDevices > 0 ? Math.round(totalXp / totalDevices) : 0;

    // Appareils actifs : vus au cours des 7 / 30 derniers jours.
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const activeLast7Days = devices.filter(d => now - new Date(d.lastSeenAt).getTime() < 7 * DAY).length;
    const activeLast30Days = devices.filter(d => now - new Date(d.lastSeenAt).getTime() < 30 * DAY).length;

    // Popularité des thèmes — combien d'appareils ont joué à chaque thème
    // (themeXp est stocké comme une Map Mongo, .lean() la renvoie en objet).
    const themePopularity = {};
    for (const d of devices) {
      for (const theme of Object.keys(d.themeXp || {})) {
        themePopularity[theme] = (themePopularity[theme] || 0) + 1;
      }
    }
    const topThemes = Object.entries(themePopularity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, playerCount: count }));

    const deviceSummaries = devices.map(d => ({
      deviceId: d.deviceId,
      xp: d.xp,
      level: getLevel(d.xp),
      unlockTokens: d.unlockTokens,
      unlockedThemesCount: (d.unlockedThemes || []).length,
      themesPlayedCount: Object.keys(d.themeXp || {}).length,
      bestStreakOverall: Math.max(0, ...Object.values(d.bestStreak || {})),
      firstSeenAt: d.firstSeenAt,
      lastSeenAt: d.lastSeenAt,
    }));

    res.status(200).json({
      totalDevices,
      activeLast7Days,
      activeLast30Days,
      avgXp,
      topThemes,
      devices: deviceSummaries,
    });
  } catch (err) {
    errorHandler(err, res);
  }
};
