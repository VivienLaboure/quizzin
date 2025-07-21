export interface IData {
    [category: string]: {
        [difficulty: number]: {
            question: string;
            reponse: string;
            propositions: string[];
            explication: string;
        }[];
    };
}
