import { IData } from "../interfaces/IData";
import { IQuizz } from "../interfaces/IQuizz";


export function GetRandomQuizz(data: IData, category: string, difficulty: number, count: number) {

    // Mélanger le tableau aléatoirement
    let shuffled = data[category][difficulty].sort(() => 0.5 - Math.random());

    // Prendre les 'count' premiers éléments après le mélange
    return shuffled.slice(0, count) as IQuizz[];
}