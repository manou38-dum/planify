// Postes de bénévoles par activité (tournoi / rencontre).
// Source : tableau généré par IA le 30/09/2026 à partir de docs/prompts/PROMPT-PLANNING-BENEVOLES.md,
// relu par Claude (alias ambigus retirés, arbitrage ajouté aux sports collectifs).
// Aucun appel externe : tout est calculé ici, gratuitement.

export const ACTIVITES = [
 {
  "cle": "football",
  "nom": "Football",
  "alias": [
   "football",
   "foot",
   "soccer",
   "five",
   "foot a 5"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des équipes",
    "description": "Accueillir les joueurs et indiquer les vestiaires ou le terrain",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Arbitrage des matchs",
    "description": "Arbitrer un ou plusieurs matchs selon le planning, à tour de rôle",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement du matériel",
    "description": "Rassembler les ballons, chasubles et déchets après les matchs",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 2,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "futsal",
  "nom": "Futsal",
  "alias": [
   "futsal",
   "foot en salle",
   "football en salle",
   "foot salle"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des équipes",
    "description": "Accueillir les joueurs et répartir les équipes sur le créneau",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Arbitrage des matchs",
    "description": "Arbitrer un ou plusieurs matchs selon le planning, à tour de rôle",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement de salle",
    "description": "Ranger les chasubles et vérifier que la salle est laissée propre",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 2,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "basket",
  "nom": "Basket",
  "alias": [
   "basket",
   "basketball",
   "basket ball"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des joueurs",
    "description": "Accueillir les joueurs et préparer les équipes avant le premier match",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Arbitrage des matchs",
    "description": "Arbitrer un ou plusieurs matchs selon le planning, à tour de rôle",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Table des scores",
    "description": "Noter simplement les scores et le temps des matchs si besoin",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "volley",
  "nom": "Volley",
  "alias": [
   "volley",
   "volleyball",
   "volley ball"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Préparation des matchs",
    "description": "Répartir les équipes et préparer le planning des rotations",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Arbitrage des matchs",
    "description": "Arbitrer un ou plusieurs matchs selon le planning, à tour de rôle",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement du matériel",
    "description": "Ranger les ballons et le petit matériel après la rencontre",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 2,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "beach_volley",
  "nom": "Beach-volley",
  "alias": [
   "beach volley",
   "beachvolley",
   "volley plage",
   "volley sur sable"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des équipes",
    "description": "Accueillir les joueurs et indiquer les terrains réservés",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Arbitrage des matchs",
    "description": "Arbitrer un ou plusieurs matchs selon le planning, à tour de rôle",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement de plage",
    "description": "Ramasser les ballons, bouteilles et affaires oubliées après les matchs",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 2,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "handball",
  "nom": "Handball",
  "alias": [
   "handball",
   "hand",
   "hand ball"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des équipes",
    "description": "Accueillir les joueurs et présenter le déroulé des matchs",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Arbitrage des matchs",
    "description": "Arbitrer un ou plusieurs matchs selon le planning, à tour de rôle",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Table des scores",
    "description": "Noter les scores et annoncer les changements de match",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "rugby_toucher",
  "nom": "Rugby à toucher",
  "alias": [
   "rugby a toucher",
   "touch rugby",
   "rugby touch"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Préparation des équipes",
    "description": "Répartir les joueurs et rappeler les règles simples avant de commencer",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Arbitrage des matchs",
    "description": "Arbitrer un ou plusieurs matchs selon le planning, à tour de rôle",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement du terrain",
    "description": "Récupérer les ballons et les repères de terrain après les matchs",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 2,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "ultimate",
  "nom": "Ultimate frisbee",
  "alias": [
   "ultimate",
   "ultimate frisbee",
   "frisbee"
  ],
  "lieu_souvent_equipe": false,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Repères de terrain",
    "description": "Poser les plots pour délimiter simplement les zones de jeu",
    "debut_minutes": -30,
    "duree_minutes": 30,
    "min_benevoles": 2,
    "plus_un_par_participants": null,
    "si_repas": false
   },
   {
    "nom_poste": "Arbitrage des matchs",
    "description": "Arbitrer un ou plusieurs matchs selon le planning, à tour de rôle",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement des plots",
    "description": "Ramasser les plots, les disques et les déchets après la rencontre",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 2,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "padel",
  "nom": "Padel",
  "alias": [
   "padel",
   "paddle",
   "padel tennis"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des joueurs",
    "description": "Accueillir les joueurs et répartir les paires sur les terrains réservés",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Suivi des rotations",
    "description": "Annoncer les rotations pour que chacun passe sur le terrain",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "tennis",
  "nom": "Tennis",
  "alias": [
   "tennis",
   "tournoi tennis",
   "double tennis"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des joueurs",
    "description": "Accueillir les joueurs et donner l'ordre des matchs",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Suivi des scores",
    "description": "Noter les résultats pour préparer les matchs suivants",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "badminton",
  "nom": "Badminton",
  "alias": [
   "badminton",
   "badminton double"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des joueurs",
    "description": "Accueillir les joueurs et préparer les rotations sur les terrains",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement de salle",
    "description": "Ranger les volants et le petit matériel après les matchs",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 2,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "tennis_table",
  "nom": "Tennis de table",
  "alias": [
   "tennis de table",
   "ping pong",
   "pingpong"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des joueurs",
    "description": "Accueillir les joueurs et indiquer les tables prévues",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Suivi des scores",
    "description": "Noter les résultats pour organiser les parties suivantes",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "petanque",
  "nom": "Pétanque",
  "alias": [
   "petanque",
   "boules",
   "jeu de boules",
   "boule lyonnaise"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Préparation des équipes",
    "description": "Répartir les joueurs et afficher simplement les premières parties",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Suivi des parties",
    "description": "Noter les résultats pour proposer les parties suivantes",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "molkky",
  "nom": "Mölkky",
  "alias": [
   "molkky",
   "molky",
   "quilles finlandaises",
   "jeu de quilles"
  ],
  "lieu_souvent_equipe": false,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Mise en place",
    "description": "Installer les jeux et organiser les équipes avant les premières manches",
    "debut_minutes": -30,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement des jeux",
    "description": "Rassembler les quilles et ranger les jeux à la fin",
    "debut_minutes": 165,
    "duree_minutes": 20,
    "min_benevoles": 1,
    "plus_un_par_participants": null,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "course_trail",
  "nom": "Course à pied / trail",
  "alias": [
   "course a pied",
   "trail",
   "running",
   "jogging",
   "course nature"
  ],
  "lieu_souvent_equipe": false,
  "duree_evenement_minutes": 150,
  "postes": [
   {
    "nom_poste": "Balisage du parcours",
    "description": "Poser les repères aux changements de direction avant le départ",
    "debut_minutes": -90,
    "duree_minutes": 75,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Serre-file du groupe",
    "description": "Rester derrière le dernier coureur pour garder le groupe ensemble",
    "debut_minutes": 0,
    "duree_minutes": 150,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   },
   {
    "nom_poste": "Débalisage du parcours",
    "description": "Retirer les repères du parcours après le passage du groupe",
    "debut_minutes": 135,
    "duree_minutes": 45,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "vtt",
  "nom": "VTT",
  "alias": [
   "vtt",
   "velo tout terrain",
   "mountain bike",
   "enduro",
   "rando vtt"
  ],
  "lieu_souvent_equipe": false,
  "duree_evenement_minutes": 150,
  "postes": [
   {
    "nom_poste": "Balisage du parcours",
    "description": "Poser les repères aux croisements avant le départ du groupe",
    "debut_minutes": -90,
    "duree_minutes": 75,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Serre-file du groupe",
    "description": "Rouler en dernier pour garder le groupe réuni sur le parcours",
    "debut_minutes": 0,
    "duree_minutes": 150,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Débalisage du parcours",
    "description": "Retirer les repères et vérifier que rien ne reste sur le parcours",
    "debut_minutes": 135,
    "duree_minutes": 45,
    "min_benevoles": 2,
    "plus_un_par_participants": 20,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "velo_route",
  "nom": "Vélo de route",
  "alias": [
   "velo de route",
   "velo route",
   "cyclisme",
   "sortie velo",
   "sortie cyclo"
  ],
  "lieu_souvent_equipe": false,
  "duree_evenement_minutes": 150,
  "postes": [
   {
    "nom_poste": "Briefing du départ",
    "description": "Présenter le parcours et rappeler les points de regroupement avant de partir",
    "debut_minutes": -30,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": null,
    "si_repas": false
   },
   {
    "nom_poste": "Serre-file du groupe",
    "description": "Rouler en dernier pour garder un œil sur le dernier participant",
    "debut_minutes": 0,
    "duree_minutes": 150,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Ravitaillement du groupe",
    "description": "Préparer et distribuer eau et encas au point prévu",
    "debut_minutes": 60,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": true
   }
  ]
 },
 {
  "cle": "randonnee",
  "nom": "Randonnée",
  "alias": [
   "randonnee",
   "rando",
   "marche",
   "balade",
   "trek"
  ],
  "lieu_souvent_equipe": false,
  "duree_evenement_minutes": 150,
  "postes": [
   {
    "nom_poste": "Préparation du départ",
    "description": "Accueillir le groupe et rappeler le parcours prévu avant de partir",
    "debut_minutes": -30,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Serre-file du groupe",
    "description": "Marcher en dernier pour garder le groupe rassemblé",
    "debut_minutes": 0,
    "duree_minutes": 150,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Goûter du groupe",
    "description": "Préparer et distribuer les boissons et encas prévus",
    "debut_minutes": 60,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": true
   }
  ]
 },
 {
  "cle": "natation",
  "nom": "Natation",
  "alias": [
   "natation",
   "piscine",
   "nage",
   "sortie piscine"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 150,
  "postes": [
   {
    "nom_poste": "Accueil du groupe",
    "description": "Accueillir les participants et indiquer les vestiaires ou lignes réservées",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Point de rendez-vous",
    "description": "Rassembler le groupe à la sortie et vérifier que personne ne manque",
    "debut_minutes": 135,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "kayak_canoe",
  "nom": "Kayak / canoë",
  "alias": [
   "kayak",
   "canoe",
   "kayak canoe",
   "descente canoe",
   "stand up paddle"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 150,
  "postes": [
   {
    "nom_poste": "Accueil au départ",
    "description": "Accueillir le groupe et aider à répartir les embarcations prévues",
    "debut_minutes": -45,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Serre-file sur l'eau",
    "description": "Rester derrière la dernière embarcation pour garder le groupe ensemble",
    "debut_minutes": 0,
    "duree_minutes": 150,
    "min_benevoles": 1,
    "plus_un_par_participants": 15,
    "si_repas": false
   },
   {
    "nom_poste": "Accueil à l'arrivée",
    "description": "Aider le groupe à se retrouver au point d'arrivée prévu",
    "debut_minutes": 120,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "escalade",
  "nom": "Escalade",
  "alias": [
   "escalade",
   "grimpe",
   "salle escalade"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 150,
  "postes": [
   {
    "nom_poste": "Accueil du groupe",
    "description": "Accueillir les participants et indiquer le fonctionnement de la séance",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Point de rendez-vous",
    "description": "Rassembler le groupe à la fin pour vérifier les départs",
    "debut_minutes": 135,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "bowling",
  "nom": "Bowling",
  "alias": [
   "bowling",
   "bowling party",
   "quilles bowling"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des joueurs",
    "description": "Accueillir les joueurs et répartir les groupes sur les pistes",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Suivi des groupes",
    "description": "Aider les groupes à retrouver leur piste et organiser les rotations",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "mini_golf",
  "nom": "Mini-golf",
  "alias": [
   "mini golf",
   "minigolf",
   "golf miniature"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil des groupes",
    "description": "Accueillir les joueurs et répartir les groupes sur le parcours",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Suivi des scores",
    "description": "Rassembler les scores si le groupe souhaite un classement final",
    "debut_minutes": 120,
    "duree_minutes": 60,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "laser_game_paintball",
  "nom": "Laser game / paintball",
  "alias": [
   "laser game",
   "lasergame",
   "paintball",
   "laser tag"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Accueil du groupe",
    "description": "Accueillir les participants et les aider à se répartir par équipes",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Point de rendez-vous",
    "description": "Rassembler le groupe entre les parties et avant le départ",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "echecs",
  "nom": "Échecs",
  "alias": [
   "echecs",
   "echec",
   "chess",
   "tournoi echecs"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Installation des tables",
    "description": "Préparer les tables, échiquiers et feuilles de résultat avant les parties",
    "debut_minutes": -30,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Suivi des parties",
    "description": "Noter les résultats pour préparer les rondes suivantes",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "jeux_societe",
  "nom": "Jeux de société",
  "alias": [
   "jeux de societe",
   "jeu de societe",
   "board game",
   "board games",
   "soiree jeux"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Installation des jeux",
    "description": "Préparer les tables et sortir les jeux choisis pour la soirée",
    "debut_minutes": -30,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement des jeux",
    "description": "Vérifier les boîtes et ranger les jeux après la soirée",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "cartes",
  "nom": "Cartes",
  "alias": [
   "cartes",
   "belote",
   "tarot",
   "jeu de cartes",
   "soiree belote"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Installation des tables",
    "description": "Préparer les tables et les jeux de cartes avant les premières parties",
    "debut_minutes": -30,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Suivi des scores",
    "description": "Noter les scores pour annoncer le résultat final si le groupe le souhaite",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "esport",
  "nom": "Jeux vidéo (e-sport)",
  "alias": [
   "esport",
   "e sport",
   "jeux video",
   "gaming",
   "tournoi fifa",
   "tournoi jeu video"
  ],
  "lieu_souvent_equipe": true,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Préparation des postes",
    "description": "Vérifier les écrans, manettes et connexions avant le début des parties",
    "debut_minutes": -45,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 20,
    "si_repas": false
   },
   {
    "nom_poste": "Suivi des matchs",
    "description": "Noter les résultats et appeler les joueurs pour leurs matchs",
    "debut_minutes": 0,
    "duree_minutes": 180,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement des postes",
    "description": "Ranger les manettes et vérifier que les postes sont bien éteints",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   }
  ]
 },
 {
  "cle": "autre_sport",
  "nom": "Autre sport",
  "alias": [
   "autre sport",
   "activite sportive",
   "tournoi sportif",
   "rencontre sportive"
  ],
  "lieu_souvent_equipe": false,
  "duree_evenement_minutes": 180,
  "postes": [
   {
    "nom_poste": "Installation légère",
    "description": "Mettre en place les petits repères ou le matériel prévu par l'organisateur",
    "debut_minutes": -45,
    "duree_minutes": 45,
    "min_benevoles": 2,
    "plus_un_par_participants": 30,
    "si_repas": false
   },
   {
    "nom_poste": "Accueil des participants",
    "description": "Accueillir les participants et expliquer simplement le déroulé de l'activité",
    "debut_minutes": -30,
    "duree_minutes": 45,
    "min_benevoles": 1,
    "plus_un_par_participants": 25,
    "si_repas": false
   },
   {
    "nom_poste": "Rangement du matériel",
    "description": "Ranger le matériel utilisé et laisser le lieu propre après l'activité",
    "debut_minutes": 165,
    "duree_minutes": 30,
    "min_benevoles": 2,
    "plus_un_par_participants": 30,
    "si_repas": false
   }
  ]
 }
]

const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// Reconnaît l'activité tapée librement (« rando VTT », « Ping-pong »…). L'alias le plus long gagne.
export function matchSportActivity(text) {
  const t = ` ${fold(text)} `
  if (!t.trim()) return null
  let best = null
  for (const activite of ACTIVITES) {
    if (activite.cle === 'autre_sport') continue
    for (const alias of activite.alias) {
      const a = fold(alias)
      if (a && t.includes(` ${a} `) && (!best || a.length > best.len)) best = { activite, len: a.length }
    }
  }
  return best ? best.activite : null
}

const INSTALLATION = /install|mise en place|montage|balisage|reperes de terrain|preparation des postes/

// Construit les créneaux proposés aux invités.
// - sport non reconnu ou vide : postes génériques pré-remplis, marqués « À remplir » pour l'organisateur ;
// - postes « si_repas » seulement si un repas est prévu ; buvette ajoutée si repas prévu et aucun poste repas ;
// - sans aide à l'installation : postes d'installation retirés.
export function activityPlanning(sport, startHHMM, nbParticipants, options = {}) {
  if (!startHHMM) return []
  const [h, m] = String(startHHMM).split(':').map(Number)
  if (!Number.isFinite(h)) return []
  const startMin = h * 60 + (m || 0)
  const fmt = mins => {
    const x = ((mins % 1440) + 1440) % 1440
    return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
  }
  const n = Math.max(1, Number(nbParticipants) || 10)
  const known = matchSportActivity(sport)
  const activite = known || ACTIVITES.find(a => a.cle === 'autre_sport')
  const repas = !!options.repas_enabled
  let postes = activite.postes.filter(p => !p.si_repas || repas)
  if (repas && !postes.some(p => p.si_repas)) {
    const sortie = activite.postes.some(p => /serre-file/i.test(p.nom_poste))
    postes = [...postes, sortie
      ? { nom_poste: "Repas à l'arrivée", description: "Préparer et servir le repas prévu au retour du groupe", debut_minutes: activite.duree_evenement_minutes - 15, duree_minutes: 60, min_benevoles: 2, plus_un_par_participants: 20, si_repas: true }
      : { nom_poste: 'Buvette et repas', description: 'Servir les boissons et le repas prévu, puis réapprovisionner', debut_minutes: 0, duree_minutes: activite.duree_evenement_minutes, min_benevoles: 2, plus_un_par_participants: 20, si_repas: true }]
  }
  if (options.aide_installation === false) postes = postes.filter(p => !INSTALLATION.test(fold(p.nom_poste)))
  return [...postes].sort((a, b) => a.debut_minutes - b.debut_minutes).map(p => ({
    slot_name: p.nom_poste,
    description: known ? p.description : `À remplir : ${p.description.charAt(0).toLowerCase()}${p.description.slice(1)}`,
    start_time: fmt(startMin + p.debut_minutes),
    duration_minutes: p.duree_minutes,
    max_participants: p.min_benevoles + (p.plus_un_par_participants ? Math.floor(n / p.plus_un_par_participants) : 0),
  }))
}
