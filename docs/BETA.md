# Bêta Planify : du 5 au 25 octobre 2026

Préparé par Claude le 30 septembre 2026. Coût : **0 €**. Aucun outil payant, aucun traceur : les chiffres sont calculés directement dans la base de données (`bilan-beta.sql`).

## L'objectif

Prouver que de **vrais organisateurs** obtiennent des réponses de leurs invités et répartissent les apports **sans relancer à la main**, avant d'ouvrir Planify au public.

## Le point de départ : tes tests de septembre

Il y a 13 événements hors « TEST ». Parmi eux, **38 %** ont reçu au moins une réponse. En moyenne, un événement a reçu **0,5 réponse**, et **14 %** des apports ont été réservés.

Ces chiffres viennent de tes tests, pas de vrais invités. La bêta donnera la première vraie mesure.

---

## 1. Qui recruter : 8 organisateurs

**Un seul critère obligatoire : avoir un vrai événement entre le 8 et le 25 octobre, avec au moins 6 invités.** Un événement inventé pour faire plaisir ne mesure rien.

| Type | Nombre | Pourquoi |
|---|---|---|
| BBQ, apéro ou soirée | 2 | Le cœur du produit : listes d'apports |
| Anniversaire (dont 1 anniversaire d'enfant) | 2 | Réponses des parents, cadeaux, surprise |
| Sortie (rando, vélo) | 2 | Matériel de chacun, covoiturage |
| Tournoi ou association | 1 | Bénévoles, créneaux |
| Au choix | 1 | Ce qui se présente |

**Pourquoi 8 ?** Selon Nielsen (2000), 5 utilisateurs suffisent pour trouver environ 85 % des problèmes d'ergonomie. On en recrute 8 parce qu'on suppose qu'environ 30 % se désisteront : il en restera au moins 5 qui vont au bout.

Pour obtenir ces 8 oui, contacte environ **12 personnes** : famille, amis, collègues, club de sport, parents d'école, association.

Mélange les âges : au moins 3 personnes de plus de 45 ans. Si elles s'en sortent seules, tout le monde s'en sortira.

Avec environ 10 invités par événement, cela fait **80 invités** qui testent aussi la page de réponse, sans effort de ta part.

## 2. Les 5 chiffres à suivre

Ces chiffres sont calculés automatiquement. Demande « bilan bêta » à Claude, ou lance `bilan-beta.sql` dans Supabase → SQL Editor.

| Chiffre | Objectif | Ce qu'il prouve | Si l'objectif est raté |
|---|---|---|---|
| Événements avec au moins 1 réponse | **≥ 80 %** | L'organisateur partage vraiment le lien | Le partage est trop compliqué : revoir l'écran après la création |
| Réponses par événement | **≥ 6** | Les invités répondent | La page d'invitation freine : la simplifier |
| Personnes confirmées / personnes attendues | **≥ 60 %** | Planify remplace les « tu viens ? » sur WhatsApp | Revoir le message de relance |
| Apports réservés / apports de la liste | **≥ 50 %** (14 % aujourd'hui) | La fonction phare sert vraiment | Listes trop longues ou choix trop laborieux |
| Délai médian avant la 1re réponse | **≤ 24 h** | L'invitation donne envie de répondre tout de suite | Revoir l'accroche et l'aperçu WhatsApp |

**Règle pendant la bêta :** tes propres essais doivent s'appeler « TEST … ». Ils sont alors exclus des chiffres.

## 3. Les 3 questions à poser après l'événement

1. **Réutiliserais-tu Planify pour ton prochain événement ?** Oui, peut-être ou non. Objectif : au moins 6 oui sur 8.
2. **Si Planify disparaissait demain, tu serais : très déçu, un peu déçu, pas déçu ?** C'est le test de Sean Ellis : quand au moins 40 % des utilisateurs répondent « très déçu », le produit répond à un vrai besoin.
3. **À quel moment as-tu hésité ou perdu du temps ?** C'est la question la plus utile : elle donne la liste des corrections à faire.

Demande aussi à 2 ou 3 invités de chaque événement : « C'était simple de répondre ? Note de 1 à 5 ». Objectif : une moyenne d'au moins 4.

## 4. Calendrier

| Date | Action | Qui |
|---|---|---|
| Jeu. 1 → dim. 4 oct. | Recruter : envoyer le **message 1** à 12 personnes | Manou |
| Dim. 4 oct. | Envoyer les consignes avec le **message 2** aux 8 qui ont dit oui | Manou |
| Semaine du 5 oct. | Chaque testeur crée son événement. Pour 2 ou 3 d'entre eux, **regarde-le faire sans aider** pendant 10 min (en vrai ou en appel vidéo) et note chaque hésitation | Manou |
| 2 jours après chaque création | Si l'événement a 0 réponse, envoyer le **message 3** | Manou (Claude te dit lesquels) |
| Lun. 12 et lun. 19 oct. | Point hebdo : demander « bilan bêta » à Claude, qui donne les 5 chiffres et la liste des freins | Claude |
| Lendemain de chaque événement | Envoyer le **message 4** (3 questions) | Manou |
| Lun. 26 oct. | Bilan final et décision | Manou décide, Claude prépare |

## 5. La décision du 26 octobre

- **On lance au public** (bouche-à-oreille, groupes WhatsApp, associations) si les 3 conditions suivantes sont réunies :
  - au moins 3 des 5 chiffres atteints ;
  - au moins 6 organisateurs sur 8 répondent « je réutiliserais » ;
  - aucun bug bloquant n'est encore ouvert.
- **On corrige puis on fait une 2e vague** dans les autres cas : on corrige les 3 plus gros freins en 2 semaines, puis on recommence avec 8 nouveaux organisateurs.
- **On revoit le produit** si moins de 40 % des événements ont une réponse **et** si moins de 3 organisateurs sur 8 le réutiliseraient. Le problème ne vient alors pas des détails, mais de l'idée elle-même ou de sa présentation.

## 6. Bugs et retours

- **Comment les testeurs signalent :** une capture d'écran sur WhatsApp à Manou, avec le **lien d'invitation** (jamais le lien organisateur), ou un e-mail à contact.planify@manoulabs.com.
- **Qui corrige :**
  - un bug technique va à **Codex** ;
  - un texte peu clair, un écran confus ou une question de design va à **Claude**.
- **Gravité :**
  - **bloquant** (impossible de créer ou de répondre) : corrigé dans les 24 h ;
  - **gênant** : corrigé dans la semaine ;
  - **détail** : noté pour après la bêta.
- **Gel des fonctionnalités pendant la bêta :** on ne fait que des corrections. Une nouvelle fonction fausserait les chiffres.

## 7. Ce qu'on promet aux testeurs, honnêtement

- Gratuit, sans compte, sans publicité.
- **Rien ne part tout seul :** Planify prépare les messages, et c'est l'organisateur qui les envoie.
- L'organisateur doit **garder son lien organisateur** : bouton « M'envoyer sur WhatsApp » après la création.
- Les événements sont supprimés automatiquement 12 mois après leur date.
- C'est une bêta : un bug est possible, et le signaler aide beaucoup.

---

## Messages prêts à envoyer

C'est toi qui les envoies, depuis ton téléphone. Adapte le prénom.

### Message 1 : recrutement (1 au 4 oct.)

> Salut [Prénom] ! J'ai monté une petite appli gratuite pour organiser un événement entre proches : invitation, qui vient, qui apporte quoi, sans le bazar du groupe WhatsApp.
> Tu as quelque chose de prévu entre le 8 et le 25 octobre (anniv, BBQ, sortie, tournoi…) ? Si oui, ça me rendrait service que tu l'organises avec. Ça prend 5 minutes, et tu me dis ensuite ce qui coince. Partant(e) ?

### Message 2 : consignes (4 oct.)

> Merci [Prénom] ! C'est ici : https://planify.manoulabs.com
> 1. Crée ton événement (tu peux même le dicter).
> 2. Juste après, clique sur « M'envoyer sur WhatsApp » pour garder ton lien organisateur : c'est ta clé.
> 3. Partage l'invitation à tes invités comme d'habitude.
> Rien n'est envoyé automatiquement, c'est toi qui gardes la main. Si un truc bloque ou t'agace, envoie-moi une capture : c'est exactement ce que je cherche.

### Message 3 : coup de pouce si aucune réponse au bout de 2 jours

> Hello [Prénom], ton invitation pour [événement] est prête, mais je ne vois pas encore de réponse. Tu as pu la partager ? Si quelque chose t'a arrêté, dis-le-moi, ça m'aide énormément. Sinon, le bouton « Relancer » te prépare un message tout fait.

### Message 4 : après l'événement

> Merci d'avoir testé pour [événement] ! 3 questions rapides :
> 1. Tu réutiliserais Planify pour ton prochain événement ? (oui / peut-être / non)
> 2. Si l'appli disparaissait demain, tu serais : très déçu(e) / un peu déçu(e) / pas déçu(e) ?
> 3. À quel moment tu as hésité ou perdu du temps ?
> Et si 2 ou 3 de tes invités peuvent me donner une note de 1 à 5 sur la simplicité pour répondre, c'est parfait.

### Message 5 : remerciement

> Merci [Prénom], tes retours m'ont servi : [ce qui a été corrigé grâce à lui ou elle]. Si tu réorganises quelque chose, Planify reste gratuit pour toi.

---

## Qui fait quoi

| Qui | Rôle |
|---|---|
| **Manou** | Recrute, envoie les messages, observe 2 ou 3 créations, transmet les bugs, décide le 26 oct. (environ 2 h par semaine) |
| **Claude** | Bilan chiffré chaque lundi, analyse des retours, textes et design, tri des bugs |
| **Codex** | Corrections de bugs uniquement pendant la bêta |
