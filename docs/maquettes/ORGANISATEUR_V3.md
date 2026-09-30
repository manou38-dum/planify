# Planify — Textes plus humains et suivi organisateur v3

Préparé le 30 septembre 2026 par Claude, en parallèle de Codex. Deux livrables :

1. **Textes réécrits et intégrés** : accroches d'invitation, message WhatsApp d'invitation, relance, rappel, récap final, messages tournoi (familles, bénévoles).
2. **Maquette à valider** (`organisateur-v3.html`) des deux premiers écrans organisateur. Elle n'est **pas intégrée** : l'intégration se fera après ta validation.

## Ce qui n'a pas été touché

Logique métier, Supabase, calculs, fichiers de listes (`free-mode`, `activity-planning`, `birthday-lists`, `quantity-review`), conditions d'affichage des boutons et contenu des variables (manques, créneaux, repas). Les modifications dans `app/event/[id]/page.js` portent uniquement sur des chaînes de texte.

## Principes d'écriture

- **Court.** Accroche de 90 caractères au maximum, message d'invitation de moins de 400 caractères (test automatique).
- **Une question qui appelle une réponse.** Chaque accroche finit par « Tu viens ? », « Tu passes ? », « Tu es des nôtres ? »… On répond plus facilement à une question qu'à une annonce.
- **Le nom de l'événement en gras juste sous « X t'invite ! »**, puis l'accroche. Dans WhatsApp, l'œil lit d'abord qui invite et à quoi.
- **La date limite avant l'appel à répondre**, pour que la dernière phrase avant le lien soit l'action à faire.
- **Le lien en dernière ligne, un seul lien, aucun émoji** : l'aperçu WhatsApp s'affiche et aucun caractère ne se casse.
- **Aucune promesse de fonction absente** : pas de SMS automatique, paiement, cagnotte ni rappel automatique. Un test automatique vérifie ces mots dans tous les messages.

## Accroches par défaut

L'accroche écrite par l'organisateur reste prioritaire.

| Type | Avant | Après |
|---|---|---|
| BBQ | On allume le barbecue, chacun apporte un petit quelque chose… il ne manque plus que toi ! | Le barbecue chauffe, il ne manque plus que toi. Tu viens ? |
| Apéro | Un verre, quelques bonnes choses à grignoter et du temps ensemble. Tu en es ? | Un verre, de quoi grignoter et le plaisir de se voir. Tu passes ? |
| Anniversaire | On fête {prénom} et ce sera encore mieux avec toi ! | On fête {prénom}, et ce sera bien plus beau avec toi. Tu es des nôtres ? |
| Soirée | Musique, bonne humeur et belles retrouvailles : la soirée n'attend plus que toi. | Bonne musique, bonne compagnie : la soirée sera meilleure avec toi. Tu viens ? |
| Sortie | Une belle sortie à partager. Dis-nous si tu viens pour qu'on s'organise ensemble. | Une sortie {activité} au grand air, à faire ensemble. Tu nous accompagnes ? |
| Tournoi | Une journée de jeu et de retrouvailles. Viens jouer, encourager ou donner un coup de main ! | Joueur, supporter ou bénévole : il y a une place pour toi. Tu viens ? |
| Autre | Une occasion de se retrouver et de passer un bon moment ensemble ! | Une bonne occasion de se retrouver. Tu en es ? |

La sortie reprend l'activité saisie (« Une sortie VTT au grand air… »).

## Message WhatsApp d'invitation (exemple BBQ)

```
Manu t’invite !

*BBQ chez Manu*
Le barbecue chauffe, il ne manque plus que toi. Tu viens ?

Quand : samedi 3 octobre à 14:15
Où : Au jardin

Réponse idéalement avant le jeudi 1 octobre.
Dis-nous si tu viens, avec qui, et choisis ce que tu apportes :
https://planify.manoulabs.com/invite/…
```

L'appel à répondre s'adapte à ce que l'invité peut réellement faire :
- avec apports : « Dis-nous si tu viens, avec qui, et choisis ce que tu apportes : » ;
- tournoi et organisation solo : « Dis-nous si tu viens et à combien : » ;
- anniversaire enfant : « Dis-nous si vous venez et à combien : ».

Pour un anniversaire surprise, la première ligne devient « Chut, c'est une surprise : n'en parle pas à {prénom} ! ».

## Messages préparés depuis le tableau organisateur

| Message | Nouveau texte (résumé) | Pourquoi |
|---|---|---|
| Relance | « Salut ! *{événement}* approche. Il manque encore : Merguez, Chips, Eau. Si tu peux t'en charger, réserve-le ici, ça évite les doublons : » | La liste des manques est limitée à 4 éléments (« … et 2 autres ») pour rester lisible dans WhatsApp. Sans manque : « Si tu n'as pas encore répondu, un oui ou un non nous aide beaucoup à tout prévoir. » |
| Rappel | « Plus que quelques jours avant *{événement}* ! Quand · Où. Pense à ce que tu as réservé. Et à ton créneau d'aide si tu en as pris un. » | Ton léger ; les lignes créneau et repas n'apparaissent que si l'événement en a. |
| Récap final | « C'est bouclé pour *{événement}* ! Merci à tous. Rendez-vous {date}, {lieu}. » | Remercier avant de rappeler ; plus de « à Au jardin ». |
| Tournoi, familles | « Salut ! *{événement}*, {date}, {lieu}. On vient jouer ou encourager, en famille ou entre amis. » | Même structure que l'invitation. |
| Tournoi, bénévoles | « Un coup de main pour *{événement}* ? Chaque poste compte, même pour une heure. Choisis celui qui te va : » | L'ancien texte citait « installation, buvette, arbitrage », faux depuis que les postes dépendent du sport (PR #12). |

## Maquette `organisateur-v3.html` — choix

**Écran 1, Suivi (ce qu'on voit en ouvrant l'événement)**

- **En-tête compact** : titre, date, lieu, date limite. L'organisateur connaît son événement : on libère de la place pour les chiffres.
- **« En un coup d'œil »** : trois chiffres, et seulement trois : confirmés (accompagnants compris), personnes attendues, apports réservés sur le total. Une barre de progression confirmés / attendus et, dessous, « sans réponse » et « ne viennent pas ». Toutes ces valeurs existent déjà dans la page (`nb_participants`, compteurs de réponses, articles d'apport).
- **Bandeau « À faire maintenant »** : une phrase qui résume le manque réel et un bouton « Relancer ». C'est la décision que l'organisateur vient prendre sur cette page.
- **Deux panneaux très visibles** : « Il reste à apporter » (ambre, bordure marquée, pastille de compte) puis « Déjà réservé » (vert, avec le prénom de qui s'en charge et l'étiquette « Idée d'un invité »). Quantités en pastille à droite, alignées pour une lecture en colonne.
- **Barre fixe en bas** : « Partager » et « Relancer », accessibles au pouce sans défiler.
- Le reste de la page (réponses, covoiturage, planning, liste modifiable) reste en dessous, sans changement.

**Écran 2, Partager et relancer**

- **Inviter** : l'aperçu exact du message dans une bulle WhatsApp, puis trois boutons existants : WhatsApp, Copier le message, QR code.
- **Relancer** : les trois messages déjà préparés par l'application (relance, rappel, récap final) présentés comme trois étapes. La plus utile au moment présent est ouverte et marquée « Conseillé maintenant » ; les autres sont repliées.
- **Phrase d'honnêteté** : « Planify prépare le message, c'est toi qui l'envoies, à qui tu veux. Rien ne part tout seul. »

**Accessibilité** : zones tactiles de 44 px minimum, contrastes AA (orange-700 sur blanc 5,18:1, textes ambre-950 et émeraude-950 sur fonds clairs), chiffres annoncés par des libellés, aucune information portée par la couleur seule (chaque panneau a un titre explicite).

## Intégration proposée après validation (sans changer le fonctionnement)

| Étape | Fichier | Changement |
|---|---|---|
| 1 | `app/event/[id]/page.js` | Regrouper les compteurs existants dans la carte « En un coup d'œil » + barre de progression |
| 2 | idem | Bandeau « À faire maintenant » calculé depuis `disponibles`, `pending` et `slotsIncomplets` déjà présents |
| 3 | idem | Renommer les panneaux en « Il reste à apporter » / « Déjà réservé » et ajouter la pastille de quantité |
| 4 | idem | Barre fixe Partager / Relancer qui fait défiler jusqu'aux blocs existants |
| 5 | idem | Regrouper invitation, relance, rappel et récap dans une section « Partager et relancer » |

Estimation : une demi-journée assistée, coût 0 €. Aucune requête Supabase ni calcul modifié.
