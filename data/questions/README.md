# Contenu des quiz

Chaque fichier `.json` de ce dossier représente un thème et est importé par
`npm run seed` (voir [scripts/seedQuestions.js](../../scripts/seedQuestions.js)).

## Format d'un fichier

```json
{
  "theme": "Culture-generale",
  "questions": {
    "1": [
      {
        "question": "Quel est l'élément chimique représenté par le symbole 'O' ?",
        "reponse": "Oxygène",
        "propositions": ["Or", "Oxygène", "Osmium", "Ozone"],
        "explication": "Le symbole 'O' représente l'oxygène, un gaz essentiel à la vie."
      }
    ],
    "2": [],
    "3": []
  }
}
```

Règles :
- `theme` : nom exact tel qu'affiché dans l'app (clé top-level du document Mongo `theme`).
  Réutiliser un thème existant complète la catégorie ; un nouveau nom crée une nouvelle catégorie.
- `questions` : clés `"1"`, `"2"`, `"3"` (difficulté). Une clé absente ou vide est ignorée.
- Chaque question doit avoir `reponse` présente dans `propositions`, et `propositions` sans doublon.
- Le script déduplique automatiquement par texte de question (insensible à la casse) :
  relancer `npm run seed` après avoir ajouté des questions dans un fichier existant
  ne réinsère pas celles déjà en base.

## Lancer l'import

```bash
cd backend_quizzin
npm run seed
```

Ne touche jamais la base directement pour ajouter du contenu : passe toujours par un
fichier ici + `npm run seed`, pour garder une trace versionnée de tout le contenu.
