# Planify — contexte partagé du projet

Dernière mise à jour : 1er octobre 2026 (Codex : grilles de rencontres). Ce fichier est le point de reprise commun pour Claude, Codex et les autres assistants. Ne jamais y mettre de clé ou de valeur d’environnement secrète.

## Relais — PR #30 en attente

- PR ouverte : https://github.com/manou38-dum/planify/pull/30 (`codex/tournament-schedules`). Elle ajoute les apports pour un tournoi complet et les grilles à la mêlée ou en équipes fixes, calculées après les confirmations, accompagnants inclus.
- Les grilles sont calculées dans `lib/tournament-schedules.mjs`, affichées par `app/event/[id]/page.js`, et enregistrées dans `events.event_options.match_schedule`. Aucun schéma Supabase n'a changé.
- Validation Codex : 39 tests et build production réussis. Le déploiement Vercel de prévisualisation est indiqué « Ready », mais ses deux URL renvoient actuellement une réinitialisation de connexion ; la production répond 200. Ne pas présenter la PR comme testée sur téléphone.
- Avant la bêta du 5 au 25 octobre : l'utilisateur doit arbitrer entre fusion/test avant le 5 ou report après le 25. Pendant la bêta, aucune fonctionnalité nouvelle.

## Produit

Planify aide un organisateur à créer un événement, envoyer un lien d’invitation, recueillir les réponses et répartir les apports, idées cadeaux ou tâches bénévoles. L’interface et les messages sont en français. Le projet privilégie le mode gratuit sans appel IA externe ; les listes doivent rester éditables et être présentées comme des repères, pas comme des prescriptions.

## Architecture

- Next.js 14 App Router, React 18, JavaScript et Tailwind.
- Supabase JS pour les événements, participants, listes, articles, créneaux bénévoles et inscriptions aux créneaux.
- `app/create/page.js` : formulaire, conversation de création, choix des listes et aperçu modifiable.
- `app/invite/[linkId]/InviteClient.js` : invitation publique et réponse des invités.
- `app/event/[id]/page.js` : tableau de bord organisateur, apports et postes bénévoles.
- `app/api/parse-voice/route.js` et `lib/free-mode.mjs` : saisie d’événement sans fournisseur externe.
- `app/api/generate-list/route.js` : listes et planning, avec des données déterministes en mode gratuit.
- `lib/safety-checklists.js` : repères d’équipement outdoor connus ; les conseils à risque doivent toujours être confirmés par l’encadrant.
- La configuration `event_options` est stockée avec l’événement ; ne pas ajouter de changement de schéma Supabase sans besoin démontré.

## État Git partagé

- `origin/main` comprend actuellement les changements fusionnés jusqu’à la PR #7 (deux panneaux organisateur : reste à apporter / déjà réservé).
- La PR #8 sur `codex/birthday-gift-lists` est séparée et ajoute des idées cadeaux d’anniversaire et leurs liens. Vérifier son état sur GitHub avant d’intégrer ou de modifier cette branche.
- La branche de travail `codex/outdoor-and-tournament-lists` part de `origin/main` pour les listes outdoor et le planning de tournoi. La branche est publiée sur GitHub ; vérifier sa PR avant de considérer les changements comme déployés.
- Les modifications locales `.env.local.example`, `.gitignore`, le dossier `.claude/` et les captures d’écran présents dans le checkout principal appartiennent au propriétaire du projet : ne pas les supprimer, les restaurer, ni les inclure dans un commit par défaut.

## Comportements produit et décisions

- BBQ : liste participative de nourriture/boissons/matériel, quantités modifiables, portions « gros mangeurs ».
- Anniversaire enfant/adulte : sous-type demandé ; le buffet n’est pas une liste d’apports pour un anniversaire enfant. Les cadeaux et leur parcours d’achat sont traités dans la PR #8.
- Sortie / Activité (`Randonnée`) : le champ `event_options.activite` distingue le sport. Les checklists disponibles restent gratuites et partageables ; les consignes de sécurité d’une activité encadrée ne sont pas validées par Planify.
- Tournoi complet : ne pas confondre les postes bénévoles (planning) et les courses/apports. La demande actuelle est d’afficher un aperçu modifiable des postes avant création, incluant un choix d’installation. L’intendance de repas reste gérée par l’organisateur/le club tant qu’une liste d’apports n’a pas été explicitement demandée.
- Apéro participatif : l’absence de nombre attendu obligatoire est intentionnelle. Le nombre de personnes se déduit des réponses confirmées ; l’organisateur peut ensuite générer la liste de courses avec un budget calculé comme nombre de partants × mise indicative. Planify ne collecte ni ne répartit l’argent. Proposition à discuter : garder la jauge facultative et montrer une date limite de réponse pour savoir quand figer les achats.
- Catégories validées et implémentées : Repas & apéro (BBQ/Apero), Fête (Anniversaire/Soirée), Sortie plein air (Randonnée), Match / tournoi, Autre. Les types internes restent inchangés.

## Retour utilisateur à traiter

1. Regroupement en cinq catégories validé par le propriétaire et implémenté sur la branche courante.
2. Développer les listes outdoor pour plongée, VTT, ski de fond et autres sorties de groupe. Des repères doivent être contextualisés ; pour la plongée, la validation revient toujours au club/encadrant.
3. Pour le tournoi complet, proposer l’installation et corriger l’absence d’aperçu/planning à la création.
4. Pour l’apéro, expliquer qu’on ne connaît pas le nombre avant les réponses ; une jauge facultative ne doit pas retarder les réponses ni le calcul des achats.

## Collaboration et vérification

Reprise Codex après livraison Claude : bundle importé et vérifié ; PR #9 toujours ouverte. Corrections ajoutées sur la branche design : masquer les ajouts invités du tournoi et les panneaux/commandes de courses du tournoi sans apports ; arrondir le reste des réservations partielles avant stockage (dix décimales), et plafonner réservation/récap à la quantité réelle même inférieure à 1. Les anciennes valeurs déjà enregistrées ne sont pas migrées. Les 19 tests existants passent. Les rappels automatiques restent à réaliser séparément.

Répartition (décision du propriétaire, 29 septembre 2026) : **Claude prend le design et les textes** (présentation mobile, accroches, messages à partager). **Codex garde les corrections fonctionnelles et les rappels automatiques** (catégories, listes, parcours tournoi, logique d'envoi). Ne pas modifier le domaine de l'autre sans note de reprise.

Avancement Claude (29 septembre 2026) : maquette mobile validée par le propriétaire (`docs/maquettes/`). Intégration sur la branche `claude/mobile-ui-refresh`, partie de `codex/outdoor-and-tournament-lists` car la PR #9 n'était pas fusionnée ; la PR de Claude dépend de la PR #9. Changements d'affichage et de textes uniquement : invitation, confirmation, tableau organisateur, `lib/invitation.mjs`, nouveau `lib/ui-theme.mjs`, couleur `cream` dans Tailwind. Aucune requête Supabase, aucun champ `event_options`, aucune migration modifiés. Build et tests existants OK ; parcours vérifiés à 375 px sur une base simulée ; essai sur la vraie base à faire sur l'aperçu Vercel. Détail et points signalés à Codex dans `docs/maquettes/INTEGRATION.md`. Les messages préparés ne promettent aucun envoi automatique.

Tournoi : repas facultatif avec choix modifiables via `event_options.meal_choices`, utilisant le vote existant des invités. Aucune liste de courses à apporter. Désactiver le repas retire les choix lors de la création.

Outdoor : ajout plongée, ski de fond et sortie générique ; VTT et randonnée utilisent leurs listes existantes. Compilation de production réussie le 29 septembre 2026. Les essais complets avec création réelle restent à réaliser après intégration.

Lire ce fichier avant une nouvelle intervention. Se coordonner par une PR ou une note de reprise partagée, garder les changements indépendants dans des branches distinctes et ne jamais présumer qu’une autre IA a fusionné/poussé une modification. Ne pas exposer de secrets. Vérifier les parcours concernés et lancer `npm run build` après les changements ; ne pas ajouter de tests miroir sans demande explicite.

Références consultées pour les repères outdoor : [FFESSM — première plongée et matériel](https://ffessm.fr/les-atp-autres-types-de-participation-aux-activites-federales), [FFESSM — équipement des plongeurs et encadrement](https://ffessm.fr/uploads/media/docs/0001/01/7ba9ce942790838a9ad870e0a55ec04712773efc.pdf), [Fédération française de ski — matériel ski de fond](https://ffs.fr/equipes-de-france/?discipline=CC).
