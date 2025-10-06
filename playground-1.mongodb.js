/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Select the database to use.
use('mongodbVSCodePlaygroundDB');


db.getCollection('PersonalScore').insertMany([
    {
        "_id": ObjectId,
        "userId": "123456",
        "userName": "Vivien",
        "scores": [
            {
                "theme": "Culture-generale",
                "difficulty": "1",
                "highScore": 8,
                "totalQuestions": 10
            },
            {
                "theme": "Astronomie",
                "difficulty": "2",
                "highScore": 10,
                "totalQuestions": 15
            }
        ]
    }
]);
/*
// Insert a few documents into the sales collection.
db.getCollection('theme').insertMany([
    {
        categorie: "Culture-generale",
        questions: [
            {
                "question": "Quel est l'élément chimique représenté par le symbole 'O' ?",
                "reponse": "Oxygène",
                "propositions": [
                    "Or",
                    "Oxygène",
                    "Osmium",
                    "Ozone"
                ],
                "explication": "Le symbole 'O' représente l'oxygène, un gaz essentiel à la vie."
            },
            {
                "question": "Qui est l'auteur de la saga littéraire 'Harry Potter' ?",
                "reponse": "J.K. Rowling",
                "propositions": [
                    "J.R.R. Tolkien",
                    "J.K. Rowling",
                    "George R.R. Martin",
                    "Stephen King"
                ],
                "explication": "'Harry Potter' est une série de livres écrite par l'auteure britannique J.K. Rowling."
            },
            {
                "question": "Quel est le nombre de joueurs dans une équipe de basket-ball sur le terrain ?",
                "reponse": "5",
                "propositions": [
                    "5",
                    "6",
                    "7",
                    "8"
                ],
                "explication": "Chaque équipe de basket-ball aligne 5 joueurs sur le terrain."
            },
            {
                "question": "Quelle est la couleur principale du logo de Facebook ?",
                "reponse": "Bleu",
                "propositions": [
                    "Rouge",
                    "Vert",
                    "Bleu",
                    "Jaune"
                ],
                "explication": "Le logo de Facebook est principalement bleu, une couleur choisie par son fondateur, Mark Zuckerberg."
            },
            {
                "question": "Quelle unité est utilisée pour mesurer l'intensité du courant électrique ?",
                "reponse": "Ampère",
                "propositions": [
                    "Volt",
                    "Ohm",
                    "Ampère",
                    "Watt"
                ],
                "explication": "L'ampère est l'unité utilisée pour mesurer l'intensité du courant électrique."
            },
            {
                "question": "Quel scientifique est connu pour avoir formulé la loi de la gravitation universelle ?",
                "reponse": "Isaac Newton",
                "propositions": [
                    "Albert Einstein",
                    "Galilée",
                    "Isaac Newton",
                    "Nikola Tesla"
                ],
                "explication": "Isaac Newton a formulé la loi de la gravitation universelle au XVIIe siècle, expliquant l'attraction entre les corps."
            },
            {
                "question": "Quel pays a la plus grande superficie terrestre au monde ?",
                "reponse": "Russie",
                "propositions": [
                    "Canada",
                    "Chine",
                    "États-Unis",
                    "Russie"
                ],
                "explication": "La Russie est le plus grand pays du monde en superficie, couvrant plus de 17 millions de km²."
            },
            {
                "question": "Dans quelle ville italienne peut-on admirer le Colisée ?",
                "reponse": "Rome",
                "propositions": [
                    "Venise",
                    "Florence",
                    "Rome",
                    "Milan"
                ],
                "explication": "Le Colisée, célèbre amphithéâtre romain, est situé à Rome et date de l'an 80 après J.-C."
            },
            {
                "question": "Quelle langue a le plus grand nombre de locuteurs natifs dans le monde ?",
                "reponse": "Chinois mandarin",
                "propositions": [
                    "Anglais",
                    "Espagnol",
                    "Hindî",
                    "Chinois mandarin"
                ],
                "explication": "Le chinois mandarin est parlé par plus de 900 millions de personnes comme langue maternelle."
            },
            {
                "question": "Quel est le plus grand océan de la planète ?",
                "reponse": "Océan Pacifique",
                "propositions": [
                    "Océan Atlantique",
                    "Océan Indien",
                    "Océan Arctique",
                    "Océan Pacifique"
                ],
                "explication": "L'océan Pacifique couvre environ un tiers de la surface terrestre, ce qui en fait le plus vaste."
            },
            {
                "question": "Combien y a-t-il de planètes dans le système solaire depuis que Pluton n'est plus considérée comme une planète ?",
                "reponse": "8",
                "propositions": [
                    "7",
                    "8",
                    "9",
                    "10"
                ],
                "explication": "Depuis 2006, Pluton est classée comme planète naine, laissant 8 planètes officielles dans le système solaire."
            },
            {
                "question": "Quel artiste est célèbre pour avoir peint \"La Nuit étoilée\" ?",
                "reponse": "Vincent van Gogh",
                "propositions": [
                    "Claude Monet",
                    "Pablo Picasso",
                    "Vincent van Gogh",
                    "Salvador Dalí"
                ],
                "explication": "Vincent van Gogh a peint \"La Nuit étoilée\" en 1889, une de ses œuvres les plus emblématiques."
            },
            {
                "question": "Quel est le symbole chimique du fer ?",
                "reponse": "Fe",
                "propositions": [
                    "Ir",
                    "Fr",
                    "Fe",
                    "Fi"
                ],
                "explication": "Le fer a pour symbole 'Fe', dérivé du mot latin 'ferrum'."
            },
            {
                "question": "Quel écrivain français est l’auteur des \"Misérables\" ?",
                "reponse": "Victor Hugo",
                "propositions": [
                    "Émile Zola",
                    "Gustave Flaubert",
                    "Victor Hugo",
                    "Honoré de Balzac"
                ],
                "explication": "Victor Hugo a écrit \"Les Misérables\" en 1862, un roman majeur du XIXe siècle."
            },
            {
                "question": "Quelle est la capitale de l’Australie ?",
                "reponse": "Canberra",
                "propositions": [
                    "Sydney",
                    "Melbourne",
                    "Canberra",
                    "Brisbane"
                ],
                "explication": "Contrairement à une idée reçue, la capitale de l’Australie n’est pas Sydney, mais Canberra."
            }
        ],
        "2": [
            {
                "question": "Quel est le nom du traité qui mit fin à la Première Guerre mondiale ?",
                "reponse": "Traité de Versailles",
                "propositions": [
                    "Traité de Trianon",
                    "Traité de Versailles",
                    "Traité de Vienne",
                    "Traité de Paris"
                ],
                "explication": "Le traité de Versailles a été signé en 1919, imposant des conditions strictes à l'Allemagne."
            },
            {
                "question": "Quel mathématicien grec est considéré comme le père de la géométrie ?",
                "reponse": "Euclide",
                "propositions": [
                    "Pythagore",
                    "Euclide",
                    "Thalès",
                    "Archimède"
                ],
                "explication": "Euclide a compilé les principes de la géométrie dans son ouvrage 'Les Éléments'."
            },
            {
                "question": "Quelle est la plus longue rivière du monde selon la majorité des mesures ?",
                "reponse": "Amazonie",
                "propositions": [
                    "Nil",
                    "Yangzi Jiang",
                    "Mississippi",
                    "Amazonie"
                ],
                "explication": "Bien que le Nil soit historiquement cité, des mesures modernes placent l’Amazone en tête."
            },
            {
                "question": "Quel philosophe a écrit 'Le mythe de la caverne' ?",
                "reponse": "Platon",
                "propositions": [
                    "Socrate",
                    "Platon",
                    "Aristote",
                    "Épicure"
                ],
                "explication": "Dans 'La République', Platon illustre la perception de la réalité avec le mythe de la caverne."
            },
            {
                "question": "Quelle molécule porte la formule chimique C6H12O6 ?",
                "reponse": "Glucose",
                "propositions": [
                    "Saccharose",
                    "Glucose",
                    "Fructose",
                    "Lactose"
                ],
                "explication": "Le glucose est un sucre simple essentiel à la production d'énergie chez les êtres vivants."
            },
            {
                "question": "Quel est le nom du peintre italien connu pour 'La Naissance de Vénus' ?",
                "reponse": "Sandro Botticelli",
                "propositions": [
                    "Léonard de Vinci",
                    "Raphaël",
                    "Sandro Botticelli",
                    "Michel-Ange"
                ],
                "explication": "Botticelli a peint cette œuvre emblématique de la Renaissance vers 1485."
            },
            {
                "question": "En quelle année est tombé le mur de Berlin ?",
                "reponse": "1989",
                "propositions": [
                    "1991",
                    "1987",
                    "1989",
                    "1990"
                ],
                "explication": "Le 9 novembre 1989 marque la chute du mur, symbole de la fin de la guerre froide en Europe."
            },
            {
                "question": "Quel est l’organe principal de la photosynthèse chez les plantes ?",
                "reponse": "La feuille",
                "propositions": [
                    "La racine",
                    "Le tronc",
                    "La feuille",
                    "La fleur"
                ],
                "explication": "Les feuilles contiennent la chlorophylle, pigment clé pour capter la lumière solaire."
            },
            {
                "question": "Quel écrivain russe a écrit 'Crime et Châtiment' ?",
                "reponse": "Fiodor Dostoïevski",
                "propositions": [
                    "Anton Tchekhov",
                    "Léon Tolstoï",
                    "Fiodor Dostoïevski",
                    "Maxime Gorki"
                ],
                "explication": "Publié en 1866, ce roman explore les tourments psychologiques d’un jeune meurtrier."
            },
            {
                "question": "Quelle ville est surnommée 'la ville aux cent clochers' ?",
                "reponse": "Prague",
                "propositions": [
                    "Vienne",
                    "Rome",
                    "Prague",
                    "Lisbonne"
                ],
                "explication": "Prague est célèbre pour ses nombreuses églises et son architecture baroque et gothique."
            },
            {
                "question": "Quel est le principal gaz responsable de l'effet de serre sur Terre ?",
                "reponse": "Dioxyde de carbone",
                "propositions": [
                    "Méthane",
                    "Dioxygène",
                    "Dioxyde de carbone",
                    "Ozone"
                ],
                "explication": "Le CO₂ est le gaz à effet de serre le plus émis par les activités humaines, notamment la combustion d’énergies fossiles."
            },
            {
                "question": "Quelle est la monnaie officielle du Japon ?",
                "reponse": "Yen",
                "propositions": [
                    "Won",
                    "Yuan",
                    "Yen",
                    "Baht"
                ],
                "explication": "Le yen est la devise utilisée au Japon, identifiée par le symbole ¥."
            },
            {
                "question": "Quel est le nom de l’organe qui filtre le sang dans le corps humain ?",
                "reponse": "Rein",
                "propositions": [
                    "Poumon",
                    "Cœur",
                    "Rein",
                    "Foie"
                ],
                "explication": "Les reins filtrent les déchets du sang et régulent l’équilibre hydrique du corps."
            },
            {
                "question": "Qui a écrit '1984', un roman dystopique sur une société totalitaire ?",
                "reponse": "George Orwell",
                "propositions": [
                    "Aldous Huxley",
                    "George Orwell",
                    "Ray Bradbury",
                    "Philip K. Dick"
                ],
                "explication": "'1984', publié en 1949, critique la surveillance de masse et la manipulation de l'information."
            },
            {
                "question": "Quel pays est le berceau de la civilisation Inca ?",
                "reponse": "Pérou",
                "propositions": [
                    "Bolivie",
                    "Pérou",
                    "Colombie",
                    "Mexique"
                ],
                "explication": "L'empire Inca s’étendait principalement sur le territoire de l’actuel Pérou, avec sa capitale à Cuzco."
            },
            {
                "question": "Quel métal est liquide à température ambiante ?",
                "reponse": "Mercure",
                "propositions": [
                    "Mercure",
                    "Plomb",
                    "Zinc",
                    "Aluminium"
                ],
                "explication": "Le mercure est le seul métal qui reste liquide à température ambiante."
            },
            {
                "question": "Quel est le nom du satellite naturel de la Terre ?",
                "reponse": "La Lune",
                "propositions": [
                    "Titan",
                    "La Lune",
                    "Europe",
                    "Io"
                ],
                "explication": "La Lune est le seul satellite naturel de la Terre visible à l’œil nu."
            },
            {
                "question": "Quel roi français a été surnommé 'le Roi Soleil' ?",
                "reponse": "Louis XIV",
                "propositions": [
                    "Louis XVI",
                    "Louis XIII",
                    "Louis XIV",
                    "François Ier"
                ],
                "explication": "Louis XIV a centralisé le pouvoir absolu en France et fait construire le château de Versailles."
            },
            {
                "question": "Combien de joueurs une équipe de volley-ball compte-t-elle sur le terrain ?",
                "reponse": "6",
                "propositions": [
                    "5",
                    "6",
                    "7",
                    "8"
                ],
                "explication": "Une équipe de volley-ball est composée de 6 joueurs en jeu, répartis en première et deuxième ligne."
            },
            {
                "question": "Quelle est la capitale de la Norvège ?",
                "reponse": "Oslo",
                "propositions": [
                    "Copenhague",
                    "Stockholm",
                    "Oslo",
                    "Helsinki"
                ],
                "explication": "Oslo est la capitale et la plus grande ville de Norvège."
            }
        ],
        "3": [
            {
                "question": "Quel physicien a proposé la théorie des cordes comme unification des forces fondamentales ?",
                "reponse": "Gabriele Veneziano",
                "propositions": [
                    "Stephen Hawking",
                    "Albert Einstein",
                    "Gabriele Veneziano",
                    "Richard Feynman"
                ],
                "explication": "Gabriele Veneziano est considéré comme le pionnier de la théorie des cordes avec sa formule de 1968."
            },
            {
                "question": "Quel est le nom du cycle biochimique qui permet aux plantes de fixer le carbone ?",
                "reponse": "Cycle de Calvin",
                "propositions": [
                    "Cycle de Krebs",
                    "Cycle de Calvin",
                    "Cycle de Benson",
                    "Cycle de la chlorophylle"
                ],
                "explication": "Le cycle de Calvin est une série de réactions dans les chloroplastes permettant la fixation du dioxyde de carbone."
            },
            {
                "question": "Quel est le seul prix Nobel qui a été refusé volontairement ?",
                "reponse": "Prix Nobel de littérature de Jean-Paul Sartre",
                "propositions": [
                    "Prix Nobel de la paix de Le Duc Tho",
                    "Prix Nobel de médecine d'Alexis Carrel",
                    "Prix Nobel de littérature de Jean-Paul Sartre",
                    "Prix Nobel de chimie de Fritz Haber"
                ],
                "explication": "Jean-Paul Sartre a refusé le Nobel en 1964, rejetant toute forme d'institutionnalisation."
            },
            {
                "question": "Quelle langue morte était parlée par les Sumériens ?",
                "reponse": "Le sumérien",
                "propositions": [
                    "L'akkadien",
                    "Le babylonien",
                    "Le sumérien",
                    "Le hittite"
                ],
                "explication": "Le sumérien est une langue agglutinante isolée parlée en Mésopotamie au 3e millénaire av. J.-C."
            },
            {
                "question": "Quel est le nom du satellite de Saturne soupçonné d’abriter un océan sous sa surface glacée ?",
                "reponse": "Encelade",
                "propositions": [
                    "Titan",
                    "Io",
                    "Ganymède",
                    "Encelade"
                ],
                "explication": "Encelade projette des panaches de vapeur d’eau depuis son pôle sud, preuve d’un océan souterrain."
            },
            {
                "question": "Quelle femme scientifique a reçu deux prix Nobel dans deux disciplines différentes ?",
                "reponse": "Marie Curie",
                "propositions": [
                    "Lise Meitner",
                    "Rosalind Franklin",
                    "Marie Curie",
                    "Barbara McClintock"
                ],
                "explication": "Marie Curie a reçu le Nobel de physique (1903) et de chimie (1911)."
            },
            {
                "question": "Quel écrivain a inventé la langue elfique quenya ?",
                "reponse": "J.R.R. Tolkien",
                "propositions": [
                    "C.S. Lewis",
                    "J.K. Rowling",
                    "J.R.R. Tolkien",
                    "Isaac Asimov"
                ],
                "explication": "Tolkien, philologue, a créé plusieurs langues pour les peuples de la Terre du Milieu, dont le quenya."
            },
            {
                "question": "Quel est le nom du plus ancien code de lois connu à ce jour ?",
                "reponse": "Code d'Ur-Nammu",
                "propositions": [
                    "Code d'Hammurabi",
                    "Code de Justinien",
                    "Code d'Ur-Nammu",
                    "Tables de Moïse"
                ],
                "explication": "Le code d'Ur-Nammu précède celui d’Hammurabi de près de trois siècles, datant d’environ 2100 av. J.-C."
            },
            {
                "question": "Quel est le seul pays au monde à ne pas avoir de capitale officielle ?",
                "reponse": "Nauru",
                "propositions": [
                    "Vatican",
                    "Liechtenstein",
                    "Nauru",
                    "Saint-Marin"
                ],
                "explication": "Nauru n’a pas de capitale officiellement désignée ; les institutions sont réparties sur l'île."
            },
            {
                "question": "Quel philosophe a développé le concept de 'volonté de puissance' ?",
                "reponse": "Friedrich Nietzsche",
                "propositions": [
                    "Arthur Schopenhauer",
                    "Friedrich Nietzsche",
                    "Immanuel Kant",
                    "Martin Heidegger"
                ],
                "explication": "La 'volonté de puissance' chez Nietzsche exprime l’élan fondamental de dépassement de soi."
            },
            {
                "question": "Quel mathématicien est à l’origine du dernier théorème qui est resté non démontré pendant plus de 350 ans ?",
                "reponse": "Pierre de Fermat",
                "propositions": [
                    "Leonhard Euler",
                    "Pierre de Fermat",
                    "Carl Friedrich Gauss",
                    "Andrew Wiles"
                ],
                "explication": "Fermat a énoncé son célèbre théorème au XVIIe siècle. Il n’a été démontré qu’en 1994 par Andrew Wiles."
            },
            {
                "question": "Quel est le nom du traité qui a mis fin à la Première Guerre mondiale ?",
                "reponse": "Traité de Versailles",
                "propositions": [
                    "Traité de Vienne",
                    "Traité de Versailles",
                    "Traité de Tordesillas",
                    "Traité de Paris"
                ],
                "explication": "Signé en 1919, le traité de Versailles a imposé des conditions sévères à l’Allemagne."
            },
            {
                "question": "Quel physicien a énoncé le principe d'incertitude en mécanique quantique ?",
                "reponse": "Werner Heisenberg",
                "propositions": [
                    "Erwin Schrödinger",
                    "Niels Bohr",
                    "Werner Heisenberg",
                    "Max Planck"
                ],
                "explication": "Heisenberg a formulé le principe selon lequel on ne peut connaître simultanément la position et la vitesse d'une particule avec précision."
            },
            {
                "question": "Quelle civilisation est à l'origine de l'écriture cunéiforme ?",
                "reponse": "Les Sumériens",
                "propositions": [
                    "Les Égyptiens",
                    "Les Akkadiens",
                    "Les Sumériens",
                    "Les Hittites"
                ],
                "explication": "L'écriture cunéiforme a été développée par les Sumériens en Mésopotamie vers 3400 av. J.-C."
            },
            {
                "question": "Quel est le plus grand désert chaud du monde ?",
                "reponse": "Le Sahara",
                "propositions": [
                    "Le désert d’Atacama",
                    "Le désert de Gobi",
                    "Le Sahara",
                    "Le désert du Kalahari"
                ],
                "explication": "Le Sahara couvre environ 9 millions de km² en Afrique du Nord, ce qui en fait le plus vaste désert chaud."
            },
            {
                "question": "Quelle est la nature du boson de Higgs ?",
                "reponse": "Une particule scalaire",
                "propositions": [
                    "Un quark",
                    "Une particule scalaire",
                    "Un gluon",
                    "Un neutrino"
                ],
                "explication": "Le boson de Higgs est une particule scalaire associée au mécanisme de Brout–Englert–Higgs qui confère une masse aux autres particules."
            },
            {
                "question": "Qui a écrit l’œuvre philosophique 'Le monde comme volonté et comme représentation' ?",
                "reponse": "Arthur Schopenhauer",
                "propositions": [
                    "Georg Hegel",
                    "Arthur Schopenhauer",
                    "Jean-Jacques Rousseau",
                    "Baruch Spinoza"
                ],
                "explication": "Schopenhauer y expose une vision pessimiste de l’existence, où la volonté est la force irrationnelle du monde."
            },
            {
                "question": "Dans quelle ville a été fondée l’école philosophique du stoïcisme ?",
                "reponse": "Athènes",
                "propositions": [
                    "Rome",
                    "Athènes",
                    "Corinthe",
                    "Delphes"
                ],
                "explication": "Le stoïcisme a été fondé à Athènes par Zénon de Kition au IIIe siècle av. J.-C., sous un portique appelé 'Stoa'."
            },
            {
                "question": "Quel est le plus long fleuve d’Asie ?",
                "reponse": "Le Yangtsé",
                "propositions": [
                    "Le Mékong",
                    "Le Gange",
                    "Le Yangtsé",
                    "L’Amour"
                ],
                "explication": "Le Yangtsé, avec ses 6 300 km, traverse la Chine d’ouest en est, étant le troisième plus long fleuve au monde."
            },
            {
                "question": "Quel philosophe grec a été condamné à mort en buvant la ciguë ?",
                "reponse": "Socrate",
                "propositions": [
                    "Platon",
                    "Aristote",
                    "Socrate",
                    "Épicure"
                ],
                "explication": "Socrate a été condamné à mort en 399 av. J.-C. pour avoir corrompu la jeunesse et nié les dieux d’Athènes."
            }
        ]
    }]);
/*
// Run a find command to view items sold on April 4th, 2014.
const salesOnApril4th = db.getCollection('sales').find({
  date: { $gte: new Date('2014-04-04'), $lt: new Date('2014-04-05') }
}).count();

// Print a message to the output window.
console.log(`${salesOnApril4th} sales occurred in 2014.`);

// Here we run an aggregation and open a cursor to the results.
// Use '.toArray()' to exhaust the cursor to return the whole result set.
// You can use '.hasNext()/.next()' to iterate through the cursor page by page.
db.getCollection('sales').aggregate([
  // Find all of the sales that occurred in 2014.
  { $match: { date: { $gte: new Date('2014-01-01'), $lt: new Date('2015-01-01') } } },
  // Group the total sales for each product.
  { $group: { _id: '$item', totalSaleAmount: { $sum: { $multiply: [ '$price', '$quantity' ] } } } }
]);
*/