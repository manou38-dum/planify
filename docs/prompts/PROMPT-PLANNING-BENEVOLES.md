# Prompt — Planning des bénévoles par activité (Planify)

À copier en entier dans ChatGPT, Claude, Gemini ou Mistral. Colle ensuite la réponse (le bloc JSON) à Claude ou Codex pour l'intégrer à Planify.

---

Tu es responsable logistique d'événements sportifs et de loisirs **amateurs** en France : tournois entre amis, rencontres de club, sorties associatives, de 6 à 60 participants. Tu connais le terrain : ce qu'il faut réellement installer, surveiller et ranger pour chaque activité.

## Ta mission

Pour chaque activité de la liste ci-dessous, donne les **postes de bénévoles** à proposer dans une application d'organisation d'événements. Pour chaque poste, indique quand il commence par rapport à l'heure de début de l'événement, combien de temps il dure et combien de personnes il faut.

Les invités voient ces postes et s'y inscrivent. Ils doivent donc être concrets, propres à l'activité et crédibles. Exemples d'erreurs à ne pas faire : proposer de « monter les filets » pour une sortie VTT, ou de « tenir la buvette » pour une partie d'échecs entre 6 amis.

## Activités à traiter

Football, Futsal, Basket, Volley, Beach-volley, Handball, Rugby à toucher, Ultimate frisbee, Padel, Tennis, Badminton, Tennis de table, Pétanque, Mölkky, Course à pied / trail, VTT, Vélo de route, Randonnée, Natation, Kayak / canoë, Escalade, Bowling, Mini-golf, Laser game / paintball, Échecs, Jeux de société, Cartes (belote, tarot), Jeux vidéo (e-sport), Autre sport (cas générique).

## Règles

1. **De 2 à 6 postes par activité.** Seulement les postes utiles. Mieux vaut 2 postes justes que 5 inventés.
2. **Chronologie réaliste.** Installation avant le début, postes pendant l'événement, rangement à la fin. La durée de l'événement lui-même est prise **par défaut** à : 3 h pour un tournoi de sport collectif ou de raquette, 2 h 30 pour une sortie (VTT, course, rando, vélo, kayak), 3 h pour un jeu de table ou vidéo. Indique cette durée dans `duree_evenement_minutes`.
3. **Lieu équipé.** Beaucoup d'activités se font dans un lieu déjà équipé (salle, complexe de padel, bowling, piscine, salle d'escalade). Dans ce cas, **pas de montage de terrain**, seulement l'accueil ou une tâche légère. Indique `lieu_souvent_equipe: true` pour ces activités.
4. **Sécurité sans exagérer.** Pour les sorties (VTT, trail, vélo, kayak, rando), propose si c'est pertinent un poste de serre-file, de signaleur aux croisements ou de ravitaillement. N'invente **aucune obligation légale** et ne cite aucune loi. Un bénévole n'est jamais présenté comme secouriste.
5. **Nourriture facultative.** Un poste buvette, goûter ou ravitaillement n'apparaît que si l'organisateur a prévu à manger : marque-le `si_repas: true`.
6. **Nombre de bénévoles.** Donne un minimum (`min_benevoles`) et un ajout selon la taille (`plus_un_par_participants`). Exemple : 1 minimum, plus 1 tous les 15 participants → `min_benevoles: 1, plus_un_par_participants: 15`. Mets `null` si le nombre ne dépend pas de la taille.
7. **Textes pour les invités.**
   - `nom_poste` : 2 à 4 mots, sans emoji (ex. « Balisage du parcours »).
   - `description` : une phrase au tutoiement, qui dit ce qu'on fait concrètement (ex. « Poser la rubalise et les flèches aux croisements avant le départ »).
   - Français courant, sans jargon technique.
8. **Mots de reconnaissance.** Pour chaque activité, liste dans `alias` les façons dont un organisateur peut l'écrire, sans accents et en minuscules (ex. VTT : « vtt », « velo tout terrain », « mountain bike », « enduro », « rando vtt »). Ces alias servent à reconnaître l'activité tapée librement.

## Format de réponse

Réponds **uniquement** avec un bloc JSON valide, sans texte avant ni après, en respectant exactement cette structure :

```json
{
  "version": 1,
  "activites": [
    {
      "cle": "vtt",
      "nom": "VTT",
      "alias": ["vtt", "velo tout terrain", "mountain bike", "enduro"],
      "lieu_souvent_equipe": false,
      "duree_evenement_minutes": 150,
      "postes": [
        {
          "nom_poste": "Balisage du parcours",
          "description": "Poser la rubalise et les flèches aux croisements avant le départ",
          "debut_minutes": -90,
          "duree_minutes": 75,
          "min_benevoles": 2,
          "plus_un_par_participants": 20,
          "si_repas": false
        }
      ]
    }
  ]
}
```

Signification des champs horaires :
- `debut_minutes` : décalage par rapport à l'heure de début de l'événement. Négatif = avant (−90 = 1 h 30 avant). 0 = au début. Positif = après le début (150 = 2 h 30 après, par exemple pour le rangement).
- `duree_minutes` : durée du poste, entre 15 et 360.

## Vérification avant de répondre

Avant d'envoyer, relis chaque activité et vérifie que :
- aucun poste n'est absurde pour cette activité (pas de filet sans filet, pas de terrain à monter dans un lieu équipé, pas de buvette sans `si_repas: true`) ;
- les horaires se suivent : installation avant 0, rangement après la fin (`debut_minutes` ≥ `duree_evenement_minutes` − 15) ;
- chaque activité a entre 2 et 6 postes ;
- le JSON est valide (guillemets doubles, pas de virgule finale, pas de commentaire).
