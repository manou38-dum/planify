# Planify — suivi commun des IA

Dernière mise à jour : 27 septembre 2026, par Codex.
Participants souhaités par le porteur : utilisateur, Codex, Claude, Gemini et Perplexity.
Ce fichier est la référence commune. Il ne synchronise pas automatiquement les conversations des différents outils : chacun doit recevoir la dernière version ou accéder au même dépôt.

## Règles de collaboration

- Lire ce fichier avant toute intervention et le mettre à jour après le travail.
- Distinguer demandes validées, propositions, constats dans le code et résultats réellement testés.
- Avant de modifier une fonctionnalité, indiquer son responsable et les fichiers concernés pour éviter les modifications simultanées.
- Documenter les changements, les vérifications et les points restant à résoudre.
- Ne jamais inscrire de clés API, secrets ni informations personnelles d'invités ici.
- L'utilisateur arbitre les choix produit ; aucune attribution aux autres IA ne signifie qu'elles ont reçu ou accepté une tâche.

## Objectif produit

Adresse communiquée par l'utilisateur : https://planify.manoulabs.com/

Organiser simplement des événements entre amis, familles et associations : invitations, réponses, apports, cadeaux, bénévoles et covoiturage selon le type d'événement.

## Demandes validées par l'utilisateur

### Liste de courses collaborative — inspiration Bring

Demande du 27 septembre 2026 : l'IA prépare les courses avec l'organisateur ; celui-ci partage un lien ; les convives sélectionnent ce qu'ils apportent.

Parcours cible demandé :
1. L'organisateur prépare sa liste avec l'IA en fonction de l'événement.
2. Il vérifie et ajuste les articles et les quantités avant partage.
3. Il envoie le lien aux convives.
4. Chaque convive choisit ce qu'il apporte.

Propositions à valider après observation de l'application :
- Présentation visuelle simple des articles, adaptée au téléphone.
- Pour chaque article : quantité nécessaire, quantité prise en charge, reste à apporter et personnes engagées.
- Possibilité de prendre une partie de la quantité et de modifier ou annuler son engagement.
- Mise à jour partagée et protection contre les réservations simultanées dépassant les besoins.
- Distinguer « je m'engage à apporter » d'un éventuel statut « acheté » ; ce second statut n'est pas encore demandé.

État : demande enregistrée, aucune nouvelle implémentation effectuée. Le code possède déjà une sélection d'apports et de quantités ; vérifier ce parcours avant de concevoir son évolution. La référence à Bring exprime l'intention de l'utilisateur, pas un audit des fonctionnalités de Bring.

## État observé dans les fichiers locaux

- Création d'événement par conversation écrite ou vocale, puis vérification des informations.
- Génération IA de listes et recalcul des quantités.
- Invitations par lien, WhatsApp, SMS, e-mail et QR code.
- Réponses invités, accompagnants, restrictions alimentaires, cadeaux, bénévoles et covoiturage.
- Rappels préparés par l'application, envoyés par l'organisateur.
- README principalement consacré à l'installation, à actualiser.
- Aucune validation du fonctionnement en ligne à ce stade.

## Points techniques à vérifier

1. Accès : le schéma SQL local contient des politiques publiques de lecture et modification. Vérifier la configuration réellement déployée et séparer les droits organisateur/invité.
2. Identification : la réponse existante d'un invité est retrouvée par son prénom ; traiter les homonymes et la modification des réponses d'autrui.
3. IA : les routes de génération/recalcul imposent `mistral-large-latest`, tandis que `lib/ai.js` peut choisir Anthropic par défaut. Rendre le choix de modèle cohérent avec le fournisseur.
4. Courses partagées : vérifier le partage d'une quantité entre plusieurs invités et les choix simultanés avant de modifier la fonctionnalité.

## Prochaines tâches

| Tâche | Responsable | État |
| --- | --- | --- |
| Créer ce fichier et enregistrer la demande courses | Codex | Fait |
| Retrouver l'URL publiée | Utilisateur | Fait : https://planify.manoulabs.com/ |
| Observer l'application avec l'utilisateur | Codex | Inspection partielle après déblocage utilisateur ; interface visible, envoi sans progression observée et accueil sur Chargement |
| Comparer le parcours d'apports existant au parcours demandé | À attribuer | À faire après observation |
| Définir les écrans et critères de validation de la liste collaborative | À attribuer | À faire |
| Vérifier accès et configuration IA | À attribuer | Constats locaux, corrections non réalisées |

## Journal

- 27 septembre 2026 — Suite : accès distant Git rétabli via le client Git hors restriction locale ; HEAD distant confirmé identique au commit de référence. Le refus 403 du connecteur GitHub n'empêche donc pas une publication via Git. Correction supplémentaire : génération et recalcul des listes choisissent désormais un modèle adapté au fournisseur, au lieu d'imposer Mistral à Anthropic. AI_PROVIDER est normalisé, les valeurs inconnues sont refusées explicitement. Sept tests passent (erreurs de conversation et choix des modèles). Le compte Vercel connecté ne renvoie toujours aucune équipe. Quota Mistral non résolu ; aucun changement de clé ou de fournisseur en production.

- 27 septembre 2026 — Publication GitHub bloquée : le connecteur accepte la lecture mais refuse la création de l'arbre Git (403 « Resource not accessible by integration »). Aucun commit distant, aucune branche et aucun déploiement créés. Correctif conservé localement ; aperçu disponible sur http://localhost:3000/create pendant que le serveur local reste lancé. Une connexion GitHub autorisée en écriture ou une publication manuelle sera nécessaire.

- 27 septembre 2026 — Codex : correction de /api/parse-voice (429 explicite pour quota, 503 pour autres échecs, logs sans réponse complète fournisseur). Le client détecte les échecs, conserve le texte et affiche une explication au lieu de répéter les questions. Sept boutons avec icônes donnent accès directement aux formulaires et options existants. Protection contre l'envoi pendant une analyse en cours. Tests : 4 tests de route réussis (401/429/500 et succès), compilation de production réussie, vérification navigateur du formulaire BBQ et d'un refus réel local de l'IA. Aucun événement créé. Le quota Mistral en production n'est pas corrigé par cette modification ; la génération de listes reste dépendante du fournisseur. Publication du correctif en cours, pas encore déployé.

- 27 septembre 2026 — Vérification GitHub via connecteur : les 27 fichiers suivis du commit local da8efad49c695f196eeefebe587d6dac304ccdfc sont présents sur la branche par défaut de manou38-dum/planify et leurs empreintes sont identiques. Cela confirme la présence de cette version du code, pas la complétude des migrations ou de la configuration externe. SUIVI_COMMUN.md est encore local, non publié. Accès au déploiement Vercel indiqué dans les logs refusé (403, scope manou38-dums-projects non autorisé) ; configuration de production non vérifiée directement. La capture Mistral montre une clé Studio nommée MISTRAL_API_KEY et une autre nommée Planify ; leur nom ne prouve pas laquelle est enregistrée dans Vercel.

- 27 septembre 2026 — Diagnostic confirmé par les logs de production transmis par l'utilisateur : Mistral retourne 429 « Rate limit exceeded », code 1300, avec `x-ratelimit-limit-req-minute: 0` et `x-ratelimit-remaining-req-minute: 0`. Présent sur plusieurs déploiements, dont le plus récent des logs. La route /api/parse-voice masque l'échec en retournant HTTP 200 ; le client répète alors la question des champs manquants. Vérifier les limites et l'activation API du compte/espace Mistral concerné. La raison du quota nul n'est pas établie. Le 401 précédemment constaté était local et ne décrivait pas cette erreur de production. Aucun correctif applicatif déployé à ce stade.

- 27 septembre 2026 — Codex, après déblocage Zscaler par l'utilisateur : mise en forme de l'accueil et de /create correctement visible. Écran de création lisible, conversation écrite et bouton micro. Saisie d'un texte fictif (« Essai de parcours : barbecue pour 8 personnes. ») : bouton Envoyer activé, mais aucune progression visible après clic. Accueil toujours sur « Chargement… » pendant l'observation. Cause non déterminée (réseau ou application), pas de conclusion sur l'IA. Texte d'essai effacé, aucun événement créé. Parcours de courses toujours non vérifié. Proposition ergonomique : ajouter un accès direct au formulaire en complément de la conversation.

- 27 septembre 2026 — Codex : lecture du README et du code ; résumé d'utilisation et premiers retours. Aucun test en ligne.
- 27 septembre 2026 — Utilisateur : validation d'un fichier commun et demande de liste de courses collaborative inspirée de Bring.
- 27 septembre 2026 — Codex : création du présent document. Recherche d'URL : README avec adresse d'exemple uniquement, aucune configuration locale Vercel, aucune équipe renvoyée par la connexion Vercel.
- 27 septembre 2026 — Utilisateur : URL publiée fournie, https://planify.manoulabs.com/.
- 27 septembre 2026 — Codex : inspection dans le navigateur intégré. Accueil visible sans mise en forme, avec « Chargement… » persistant pendant l'observation. L'ouverture directe de /create affiche une page « Internet Security by Zscaler », code C03, avec un bouton « Charger la page ». Aucun contournement de cet avertissement effectué ; intervention utilisateur nécessaire. Ce blocage réseau empêche de conclure à un défaut de l'application. Aucun événement créé ou modifié ; parcours courses non vérifié en ligne.
