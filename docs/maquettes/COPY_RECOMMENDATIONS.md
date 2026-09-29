# Planify — Textes d'accroche et messages WhatsApp (v2)

Mise à jour du 29 septembre 2026, alignée sur la PR #9. Tous les textes sont des propositions : rien n'est encore branché dans l'application.

## Règles d'écriture

1. Tutoiement, phrases courtes, ton de quelqu'un qui invite des amis.
2. Les quantités sont des repères : « tu peux apporter », jamais « tu dois ».
3. **Aucune promesse d'envoi automatique.** Planify prépare les messages, l'organisateur les envoie. Pour l'agenda, l'alerte est proposée mais c'est l'application de l'invité qui l'active.
4. **Messages WhatsApp sans émoji.** Le code actuel les retire volontairement (`buildInvitation` : « caractères cassés ») et garde le lien Planify en dernière ligne pour que WhatsApp affiche l'aperçu de l'invitation. On conserve ces deux règles. Le gras WhatsApp (`*texte*`) reste possible.
5. Si l'organisateur a écrit sa propre accroche (`event_options.invitation_hook`), elle passe toujours avant la nôtre.

## Accroches par défaut (en-tête de l'invitation)

Aujourd'hui `invitationHook()` n'en a que deux (BBQ et une phrase générique). Proposition, par type interne, sans rien changer à la priorité de l'accroche personnalisée :

| Type interne | Catégorie | Accroche proposée |
|---|---|---|
| BBQ | Repas & apéro | On allume le barbecue, chacun apporte un petit quelque chose… il ne manque plus que toi. *(proche de l'actuelle)* |
| Apero | Repas & apéro | Un verre, quelques bonnes choses à grignoter et du temps ensemble. Tu en es ? |
| Anniversaire | Fête | On fête {pour_qui} et ce sera encore mieux avec toi ! *(sans `pour_qui` : « Un anniversaire à fêter, et ce sera encore mieux avec toi ! »)* |
| Soirée | Fête | Musique, bonne humeur et belles retrouvailles : la soirée n'attend plus que toi. |
| Randonnée | Sortie plein air | Une belle sortie à partager. Dis-nous si tu viens pour qu'on s'organise ensemble. |
| Match/Tournoi | Match / tournoi | Une journée de jeu et de retrouvailles. Viens jouer, encourager ou donner un coup de main ! |
| Autre | Autre | Une occasion de se retrouver et de passer un bon moment ensemble ! *(actuelle)* |

Anniversaire surprise : la ligne existante « Surprise : ne préviens pas … » reste en tête du message.

## Écran d'invitation

| Élément | Texte actuel | Proposition |
|---|---|---|
| Au-dessus du titre | — | « {Organisateur} t'invite » |
| Preuve sociale | jauge | « 9 personnes ont déjà dit oui, accompagnants compris » (n'afficher qu'à partir de 2 pour éviter « 1 personne ») |
| Question | Tu viens ? | Tu viens ? *(inchangé)* |
| Boutons | Oui ! / Non / Peut-être | Oui ! / Peut-être / Non *(ordre du plus au moins engageant ; mêmes valeurs Confirmé / Peut-être / Refusé)* |
| Nombre | — | « Vous serez combien ? » + « Toi compris » ; tournoi : « Joueurs et supporters » |
| Accompagnants | Prénom accompagnant 1 | inchangé, marqué « Facultatif » |
| Liste d'apports | — | « Ce que tu peux apporter » + « Coche ce que tu prends. Les quantités sont des repères, pas des obligations. » |
| Article pris | — | « Pris par Sophie » |
| Ajout invité | + Ajouter quelque chose à la liste commune | « + Ajouter une idée à la liste commune » ; étiquette « Idée d'un invité » |
| Repas tournoi | 🍽 Vote repas | « Repas du midi » + « facultatif » + « Le club propose ces choix. Ton vote compte pour tout ton groupe. » (remplacer « le club » par le prénom de l'organisateur si ce n'est pas un club) |
| Bénévole | — | « Je peux donner un coup de main » + « Installation, buvette, arbitrage… L'organisateur répartit les postes ensuite. » |
| Commentaire | — | « Un mot pour {Organisateur} (facultatif) » avec l'exemple « Allergies, retard prévu… » |
| Bouton | — | « Envoyer ma réponse », avec le résumé au-dessus : « 2 personnes · 1 apport » |

## Écran de confirmation

| Cas | Titre | Sous-titre |
|---|---|---|
| Oui | C'est noté, {prénom} ! | {Organisateur} voit ta réponse dès maintenant. + la phrase actuelle selon le cas (merci pour ta contribution / ton coup de main / on a hâte de te voir) |
| Peut-être | On note ! | Tu peux revenir sur ce lien pour confirmer avant le {date limite}. |
| Non | Dommage ! | Merci d'avoir prévenu, ça aide {Organisateur} à s'organiser. |

Bloc agenda (texte honnête, remplace toute promesse de SMS) :
> Le fichier propose une alerte la veille et 2 h avant. C'est ton application d'agenda qui décide de l'activer : vérifie-la après l'ajout.

Lien : « Garde ce lien : il te permet de retrouver ou modifier ta réponse avant le {date limite}. » (sans date limite : « avant le jour J »).

## Tableau organisateur

- Panneaux : « **Reste à apporter** — Les quantités qui cherchent encore un volontaire. » et « **Déjà réservé** — Qui apporte quoi. » (textes actuels conservés, sous-titre du second raccourci).
- Bouton : « Préparer une relance » (au lieu de « Relancer les invités », qui laisse croire à un envoi).
- Au-dessus du message : « Planify prépare le texte à partir de ce qui manque. Rien n'est envoyé automatiquement. »
- Bandeau J-2 : « Ton événement est dans 2 jours. Tu peux préparer un rappel pour tes invités. »

## Messages WhatsApp (sans émoji, lien en dernière ligne)

### Invitation — cas général (remplace `invitationMessage`)
```
Léa t'invite !

On allume le barbecue, chacun apporte un petit quelque chose… il ne manque plus que toi.

*BBQ de rentrée au jardin*
Quand : samedi 10 octobre à 19:00
Où : 12 chemin des Vignes, Meylan

Dis-nous si tu viens, avec qui, et choisis ce que tu aimerais apporter.
Réponse souhaitée avant le jeudi 8 octobre.
https://planify-e6eh.vercel.app/invite/…
```
Changements : accroche selon le type ; appel à l'action à l'impératif doux ; la date limite passe avant le lien (le lien reste la dernière ligne, comme aujourd'hui).

### Invitation — Match / tournoi, familles (remplace `buildInviteFamilies`)
```
Bonjour !
*Tournoi d'automne en doublettes* — dimanche 18 octobre à 9:00, Boulodrome municipal, Crolles.
Viens jouer ou encourager, en famille ou entre amis. Un repas est proposé le midi : choisis ton menu en répondant.
Dis-nous si tu viens et à combien :
https://planify-e6eh.vercel.app/invite/…
```
La phrase sur le repas n'apparaît que si `meal_choices` contient au moins un choix.

### Tournoi — bénévoles (remplace `buildMobilizeVolunteers`)
```
On a besoin de bras pour *Tournoi d'automne en doublettes* !
Installation, buvette, arbitrage : même une heure aide beaucoup.
Inscris-toi sur un poste ici :
https://planify-e6eh.vercel.app/invite/…
```

### Relance avant la date limite (remplace `buildRelance`)
```
Salut ! Plus que quelques jours avant *BBQ de rentrée au jardin*.

Il manque encore : salade de pâtes, pain de campagne, glaçons.

Si tu peux en prendre un, c'est ici :
https://planify-e6eh.vercel.app/invite/…

Merci !
```
Sans manque mais avec des réponses en attente : « On attend encore quelques réponses pour finaliser les courses. »

### Rappel J-2 (remplace `buildReminder`)
```
On se retrouve bientôt pour *BBQ de rentrée au jardin* !
Quand : samedi 10 octobre à 19:00 · Où : 12 chemin des Vignes, Meylan
Pense à apporter ce que tu as réservé.
Qui apporte quoi et dernières infos :
https://planify-e6eh.vercel.app/invite/…?recap=1
```
Ne garder « Pense à voter pour le repas si ce n'est pas fait » que pour les invités au tournoi avec repas.

### Récap final (remplace `buildRecapFinal`)
```
C'est confirmé pour *BBQ de rentrée au jardin*, samedi 10 octobre à 19:00 à Meylan !
Pense à apporter ce que tu as réservé.
Liste complète et qui apporte quoi :
https://planify-e6eh.vercel.app/invite/…?recap=1
```
Le code actuel ajoute un émoji de type (`typeEmoji`) dans ce message, contrairement à la règle de l'invitation. À décider : le retirer pour la cohérence (recommandé).

## Points à tester avant de valider les textes

Aperçu du lien dans WhatsApp sur iPhone et Android, rendu du gras `*…*`, longueur visible dans la notification (environ les 2 premières lignes), et affichage des apostrophes typographiques dans SMS.
