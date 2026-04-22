const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("../models/User");
const PersonalScore = require("../models/PersonalScore");
const errorHandler = require("../middleware/errorHandlers");

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/**
 * Génère un token JWT signé avec l'id utilisateur, le scoreId et le pseudo.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, scoreId: user.scoreId, pseudo: user.pseudo },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Crée un transporteur Nodemailer à partir des variables d'environnement.
 */
function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

// ─── Inscription ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { pseudo, email, password }
 * Crée le compte (non vérifié) et envoie un code à 6 chiffres par email.
 */
exports.register = async (req, res) => {
  try {
    const { pseudo, email, password } = req.body;

    if (!pseudo || !email || !password) {
      return res.status(400).json({ error: "Pseudo, email et mot de passe sont requis" });
    }
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      return res.status(400).json({ error: "Format d'email invalide" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPseudo = pseudo.trim();

    const [existingEmail, existingPseudo] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.findOne({ pseudo: { $regex: `^${normalizedPseudo}$`, $options: "i" } }),
    ]);

    // Si l'email existe déjà mais n'est pas vérifié, on réenvoie un code
    if (existingEmail && existingEmail.emailVerified) {
      return res.status(409).json({ error: "Un compte existe déjà avec cet email" });
    }
    if (existingPseudo && existingPseudo.emailVerified) {
      return res.status(409).json({ error: "Ce pseudo est déjà utilisé" });
    }
    // Pseudo déjà pris par un compte non vérifié avec un email différent
    if (existingPseudo && existingPseudo.email !== normalizedEmail) {
      return res.status(409).json({ error: "Ce pseudo est déjà utilisé" });
    }

    // Générer le code de vérification
    const code = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const hashedCode = await bcrypt.hash(code, 10);

    let user;
    if (existingEmail && !existingEmail.emailVerified) {
      // Réutiliser le compte non vérifié existant (renvoi de code)
      existingEmail.pseudo = normalizedPseudo;
      existingEmail.password = await bcrypt.hash(password, 12);
      existingEmail.verificationCode = hashedCode;
      existingEmail.verificationCodeExpiry = expiry;
      user = await existingEmail.save();
    } else {
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);

      // Créer le profil de score associé
      const scoreProfile = new PersonalScore({
        userName: normalizedPseudo,
        experience: 0,
        scores: [],
      });
      const savedScore = await scoreProfile.save();

      // Créer l'utilisateur (non vérifié)
      user = new User({
        pseudo: normalizedPseudo,
        email: normalizedEmail,
        password: hashedPassword,
        scoreId: savedScore._id,
        emailVerified: false,
        verificationCode: hashedCode,
        verificationCodeExpiry: expiry,
      });
      await user.save();
    }

    // Envoyer le code par email
    const transporter = createMailTransporter();
    await transporter.sendMail({
      from: `"Quizzin" <${process.env.MAIL_USER}>`,
      to: normalizedEmail,
      subject: "Confirme ton adresse email",
      text: `Ton code de vérification est : ${code}\n\nIl est valable 15 minutes.\n\nSi tu n'as pas créé de compte, ignore cet email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2 style="color: #FF6347;">Confirme ton adresse email</h2>
          <p>Voici ton code de vérification :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FF6347; padding: 16px; background: #f5f5f5; border-radius: 8px; text-align: center;">
            ${code}
          </div>
          <p style="color: #888; margin-top: 16px;">Ce code expire dans <strong>15 minutes</strong>.</p>
          <p style="color: #888;">Si tu n'as pas créé de compte, ignore cet email.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Un code de vérification a été envoyé à ton adresse email" });
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Vérification de l'email ──────────────────────────────────────────────────

/**
 * POST /api/auth/verify-email
 * Body: { email, code }
 * Valide le code et active le compte. Retourne un token JWT.
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email et code requis" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.verificationCode || !user.verificationCodeExpiry) {
      return res.status(400).json({ error: "Code invalide ou expiré" });
    }
    if (user.emailVerified) {
      return res.status(400).json({ error: "Cet email est déjà vérifié" });
    }
    if (new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ error: "Code expiré, veuillez refaire une inscription" });
    }

    const isCodeValid = await bcrypt.compare(code, user.verificationCode);
    if (!isCodeValid) {
      return res.status(400).json({ error: "Code incorrect" });
    }

    // Activer le compte
    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        pseudo: user.pseudo,
        email: user.email,
        scoreId: user.scoreId,
      },
    });
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Connexion ────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Adresse email non vérifiée. Vérifie ta boîte mail pour activer ton compte." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = generateToken(user);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        pseudo: user.pseudo,
        email: user.email,
        scoreId: user.scoreId,
      },
    });
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Mot de passe oublié ─────────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Envoie un code à 6 chiffres par email, valable 15 minutes.
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Réponse identique que l'utilisateur existe ou non (sécurité anti-énumération)
    if (!user) {
      return res.status(200).json({ message: "Si cet email existe, un code a été envoyé" });
    }

    // Générer un code à 6 chiffres
    const code = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetCode = await bcrypt.hash(code, 10);
    user.resetCodeExpiry = expiry;
    await user.save();

    // Envoyer l'email
    const transporter = createMailTransporter();
    await transporter.sendMail({
      from: `"Quizzin" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      text: `Votre code de réinitialisation est : ${code}\n\nIl est valable 15 minutes.\n\nSi vous n'avez pas fait cette demande, ignorez cet email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2 style="color: #FF6347;">Réinitialisation du mot de passe</h2>
          <p>Votre code de réinitialisation est :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FF6347; padding: 16px; background: #f5f5f5; border-radius: 8px; text-align: center;">
            ${code}
          </div>
          <p style="color: #888; margin-top: 16px;">Ce code expire dans <strong>15 minutes</strong>.</p>
          <p style="color: #888;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Si cet email existe, un code a été envoyé" });
  } catch (err) {
    errorHandler(err, res);
  }
};

// ─── Réinitialisation du mot de passe ────────────────────────────────────────

/**
 * POST /api/auth/reset-password
 * Body: { email, code, newPassword }
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, code et nouveau mot de passe requis" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ error: "Code invalide ou expiré" });
    }

    if (new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ error: "Code expiré, veuillez refaire une demande" });
    }

    const isCodeValid = await bcrypt.compare(code, user.resetCode);
    if (!isCodeValid) {
      return res.status(400).json({ error: "Code invalide" });
    }

    // Mettre à jour le mot de passe et nettoyer le code
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetCode = null;
    user.resetCodeExpiry = null;
    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    errorHandler(err, res);
  }
};
