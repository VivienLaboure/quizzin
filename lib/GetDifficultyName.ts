// Retourne le nom lisible d'un niveau de difficulté à partir de son identifiant numérique
export function GetDifficultyName(difficulty: number): string {
    switch (difficulty) {
        case 1: return "Facile";
        case 2: return "Moyen";
        case 3: return "Difficile";
        default: return "Difficulté non trouvée";
    }
}
