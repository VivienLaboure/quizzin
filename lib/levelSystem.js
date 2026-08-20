/**
 * Doit rester strictement identique à getLevel() dans
 * frontend_quizzin/lib/LevelSystem.ts (même seuil : 25 × n × (n − 1)).
 *
 * Utilisé côté serveur uniquement pour détecter un passage de niveau de
 * façon fiable lors d'une mise à jour d'XP, et attribuer les jetons de
 * déblocage de thème en conséquence — cette détection doit se baser sur la
 * valeur d'XP *avant* déjà stockée en base, jamais sur une valeur "avant"
 * fournie par le client, sans quoi un client malveillant pourrait se
 * fabriquer des jetons en mentant sur son XP de départ.
 */
function getLevel(xp) {
  if (xp <= 0) return 1;
  return Math.floor((1 + Math.sqrt(1 + (4 * xp) / 25)) / 2);
}

module.exports = { getLevel };
