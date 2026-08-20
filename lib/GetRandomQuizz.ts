import { IData } from "../interfaces/IData";
import { IQuizz } from "../interfaces/IQuizz";

export function GetRandomQuizz(data: IData, category: string, difficulty: number, count: number): IQuizz[] {
    // Catégorie ou difficulté absente du mock : pas de questions plutôt qu'un crash
    const pool = data[category]?.[difficulty];
    if (!pool) return [];

    // Copie du tableau pour ne pas muter les données originales
    const shuffled = [...pool];

    // Fisher-Yates shuffle : algorithme de mélange non biaisé
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count) as IQuizz[];
}

export function GetThemes(data: IData): string[] {
    return Object.keys(data);
}
