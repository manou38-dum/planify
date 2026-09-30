# Planify — Choix de design mobile (v2)

Mise à jour du 29 septembre 2026. Cette version remplace la v1 et s'aligne sur la PR #9 (`codex/outdoor-and-tournament-lists`) et sur `PROJECT_CONTEXT.md`. Maquette : `planify-ui-mockup.html` (ouvrir dans un navigateur, fonctionne hors ligne).

Statut : **proposition visuelle, en attente de validation**. Aucune page applicative n'est modifiée.

## Ce qui a changé par rapport à la v1

| Point | v1 (erronée) | v2 |
|---|---|---|
| Catégories | BBQ, Anniversaire, Outdoor, Tournoi, Rassemblement | Repas & apéro, Fête, Sortie plein air, Match / tournoi, Autre (comme la PR #9) |
| Repas tournoi | 4 pizzas codées en dur | Choix saisis par l'organisateur (`event_options.meal_choices`), bloc facultatif, masqué si le repas est désactivé |
| Tableau organisateur | Cartes de stats + liste de repas | Deux panneaux « Reste à apporter » et « Déjà réservé », avec quantités et personnes |
| Accompagnants | Nombre seul | Nombre + prénoms facultatifs, repris dans la confirmation et la liste des participants |
| Ajouts des invités | Absents | « Ajouter une idée à la liste commune » + étiquette « Idée d'un invité » |
| Rappels | « Tu recevras un SMS jeudi » (faux) | Aucune promesse d'envoi automatique. Agenda : alerte proposée, activée par l'application de l'invité. Relance : texte préparé, envoyé par l'organisateur |
| Export CSV/PDF | Proposé | Retiré : n'existe pas aujourd'hui |

## Parti pris visuel

**Chaleureux sans être enfantin.** Fond crème (`#FFF8F1`) au lieu du blanc pur, cartes blanches arrondies (20 px), ombres douces. L'en-tête de l'invitation est une grande carte colorée selon la catégorie : c'est ce que l'invité voit en premier après avoir cliqué dans WhatsApp, elle doit donner envie avant d'expliquer.

**Une couleur par catégorie, uniquement sur l'en-tête et les tuiles de création.** Le reste de l'interface reste neutre pour ne pas créer cinq applications différentes.

| Catégorie | Teinte (Tailwind) | Émoji |
|---|---|---|
| Repas & apéro | orange-100 → orange-300 | 🍽️ (🔥 BBQ, 🥂 Apéro) |
| Fête | rose-100 | 🎉 |
| Sortie plein air | teal-100 | 🧭 |
| Match / tournoi | blue-100 → blue-300 | 🏆 |
| Autre | slate-100 | ✨ |

**Couleurs d'état reprises de l'existant.** Ambre pour « Reste à apporter », émeraude pour « Déjà réservé », exactement comme la PR #7. On ne change pas le code couleur que les organisateurs connaissent déjà.

**Bouton principal orange foncé (`orange-700`, `#C2410C`).** L'orange-600 plus vif ne donne que 3,56:1 de contraste avec du texte blanc (sous le seuil WCAG AA de 4,5:1). L'orange-700 atteint 5,18:1. Pour le tournoi, le bouton passe en bleu-700 (6,7:1).

**Police système.** Aucun téléchargement de police : affichage immédiat, même en 4G faible, et zéro coût.

## Contrastes vérifiés (calcul WCAG)

| Texte / fond | Ratio | AA (4,5:1) |
|---|---|---|
| Blanc sur orange-700 (bouton) | 5,18 | ✅ |
| Blanc sur bleu-700 (bouton tournoi) | 6,70 | ✅ |
| Blanc sur green-700 (bouton WhatsApp) | 5,02 | ✅ |
| Gris texte secondaire sur crème | 7,25 | ✅ |
| Ambre-800 sur ambre-50 (panneau reste) | 6,84 | ✅ |
| Émeraude-800 sur émeraude-50 (panneau réservé) | 7,29 | ✅ |

## Ergonomie téléphone

Cibles tactiles de 44 px minimum (recommandation Apple) et 48 px pour les boutons principaux (Material). Champs en 16 px pour éviter le zoom automatique d'iOS. Bouton d'envoi fixé en bas de l'écran, avec un résumé vivant au-dessus (« 2 personnes · 1 apport ») pour que l'invité sache ce qu'il envoie sans remonter. Vérifié à 375 px de large sans défilement horizontal.

## Écran par écran

**0 · Création — catégories.** Cinq tuiles, « Autre » en pleine largeur. Même comportement que `EventCategoryPicker` de la PR #9 : une catégorie à plusieurs formats ouvre un second choix, les autres passent directement.

**1 · Invitation Repas & apéro.** Ordre : en-tête chaleureux (qui invite, titre, accroche, quand, où, date limite) → preuve sociale (« 9 personnes ont déjà dit oui ») → réponse Oui / Peut-être / Non → prénom → nombre de personnes et prénoms des accompagnants → apports à cocher, avec les articles déjà pris grisés et le nom de la personne → ajout d'une idée à la liste commune → covoiturage → commentaire. Les quantités sont affichées comme des repères. Le lien « Voir l'itinéraire » est conservé. Si l'organisateur a ajouté une photo (`photo_url`), elle remplace le dégradé en fond de l'en-tête, avec un voile clair pour garder le texte lisible.

**2 · Invitation Match / tournoi.** Pas de liste d'apports. Bloc « Repas du midi — facultatif » avec les choix de l'organisateur ; le vote vaut pour tout le groupe (comme le décompte actuel par `nb_personnes`). Case « Je peux donner un coup de main » qui alimente le vivier de bénévoles existant.

**3 · Confirmation.** Prénom de l'invité dans le titre, récapitulatif (présence avec accompagnants, apports ou créneaux), ajout à l'agenda avec une mention honnête sur les alertes, lien à garder pour modifier sa réponse, contact WhatsApp de l'organisateur si son numéro existe.

**4 · Tableau organisateur.** Compteurs (confirmés accompagnants compris, peut-être, refus) → bilan rédigé existant → **Reste à apporter** puis **Déjà réservé**, empilés sur téléphone et côte à côte à partir de 768 px (comme aujourd'hui) → bouton « Préparer une relance » qui affiche le texte et indique clairement que rien n'est envoyé automatiquement → participants avec accompagnants → partage. Pour un tournoi : pas de panneaux d'apports, mais bilan, décompte des repas et planning bénévole existants.

## Ce que la maquette ne montre pas

Anniversaire enfant et cadeaux (PR #8), apéro participatif et sa mise indicative, checklists outdoor, planning bénévole détaillé, récapitulatif `?recap=1`, QR code, blocage quand c'est complet. Ces parcours gardent leur fonctionnement ; ils recevront le même habillage (fond, cartes, typographie) lors de l'intégration.

## Coût

0 €. HTML, CSS et JavaScript sans dépendance pour la maquette ; classes Tailwind déjà installées pour l'intégration.
