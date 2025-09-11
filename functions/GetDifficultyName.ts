export function GetDifficultyName(difficulty: number) {

    // Mélanger le tableau aléatoirement
    let difficultyName:String;

    switch(difficulty){
      case 1: {
          difficultyName = "Facile";
        break;
      }
      case 2: {
          difficultyName = "Moyen";
        break;
      }
      case 3: {
          difficultyName = "Difficile";
        break;
      }
      default:
        difficultyName = "Difficulté non trouvée";
        break
    }

    // Prendre les 'count' premiers éléments après le mélange
    return difficultyName;
}