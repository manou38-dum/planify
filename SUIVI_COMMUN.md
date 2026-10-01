# Planify — suivi commun des IA

## Bêta et sécurité — 30 septembre 2026

- PR #24 (Codex) : suppression automatique 12 mois après la date de l'événement. Tâche Vercel Cron quotidienne `17 3 * * *` UTC, activée et testée en production le 30/09 : réponse 200, aucun événement supprimé ; le plus ancien date du 25/06/2026. `CRON_SECRET` et `SUPABASE_SERVICE_ROLE_KEY` sont configurées dans Vercel Production. Un appel sans secret renvoie 401.
- PR #25 (Claude) : page Confidentialité, durée de conservation de 12 mois. Il ne reste aucun « À faire » sur les pages légales.
- `security-rls.sql` reprend la correction de production pour `planify_header` : une valeur vide de `request.headers` est traitée comme un objet JSON vide.
- Bêta : du lundi 5 au dimanche 25 octobre 2026, avec 5 à 10 organisateurs et de vrais événements. Le plan est dans `docs/BETA.md` et le bilan de lecture seule dans `docs/bilan-beta.sql`.
- Pendant la bêta : gel des fonctionnalités. Codex traite seulement un bug signalé par PR, sans texte, design ni modification du schéma de base. Toute donnée de test en production commence par « TEST » puis est supprimée ; elle est exclue des statistiques.

Dernière mise à jour : 28 septembre 2026, par Codex.

## Invitations et contributions — 28 septembre

Responsable : Codex, branche `codex/invitations-shared-items`. PR 3 fusionnée (`e33459b`). Demandes : alléger WhatsApp, permettre les ajouts des invités, proposer des menus inspirés de sites réels ; refonte visuelle globale reportée à la demande de l'utilisateur.

- Partage : message court (événement, date Paris, lieu, réponse et lien unique), exclusion de toute note de calcul y compris pour les événements existants. Base d'URL des métadonnées définie pour les aperçus sociaux ; l'ancien aperçu WhatsApp peut rester en cache, aucun envoi WhatsApp effectué pendant les tests.
- Invités : formulaire d'ajout d'un article disponible (nom, quantité entière et unité) à la liste commune en mode collaboratif, après choix « Oui ». Ajout immédiat, distinct de la réservation validée avec la réponse. Détection des doublons déjà chargés ; pas de verrou global contre deux propositions identiques simultanées. Visible aux autres à la prochaine ouverture/actualisation, pas de synchronisation en direct. Aucun changement de permissions ni de schéma. Conservation du list_id lors des réservations partielles.
- Menus BBQ : choix classique, méditerranéen, légumes ; choix diététiques existants conservés. Sélection éditoriale de recettes vérifiées chez Marmiton, 750g et Manger Bouger dans `lib/menu-inspirations.mjs`. Liens pour organisateur et invités, plats préparés à apporter, quantités Planify (pas une conversion automatique des ingrédients des recettes). Pas de copie d'instructions ni d'images, pas d'IA payante.
- Confirmation : retrait des promesses de notifications/rappels automatiques non implémentées.
- Vérifications : 14 tests réussis, compilation réussie. Test navigateur avec base fictive locale : un invité ajoute Glaçons/2 sacs, un deuxième le voit à l'ouverture ; sélecteur de style et sources vérifiés. Test d'insertion Supabase sous rôle anon dans une transaction annulée réussi ; aucune donnée de test conservée en production. Revalidation finale avant publication.

## Bilan BBQ et enregistrement — 28 septembre

Responsable : Codex. Branche `codex/bbq-flow-quantities`. PR 2 fusionnée (`c463fbd`).

- Cause constatée du problème réseau : projet Supabase Planify `dprkrtiwfjbgwrcbszqc` en pause (`INACTIVE`), confirmé comme adresse utilisée par le site public. Remise en service effectuée via Supabase ; état final `ACTIVE_HEALTHY`. Tables accessibles. Insertion d'un événement sous rôle `anon` réussie dans une transaction ensuite annulée (`rollback`), sans données de test conservées. Parcours d'enregistrement complet depuis le navigateur non encore validé.
- Nombre de personnes initialement vide, demandé avec les informations essentielles et obligatoire avant calcul. Une réponse comme « 20 » est reconnue. Les portions incluent l'organisateur.
- BBQ : accès direct au formulaire récapitulatif dès les essentiels complets, avec choix du mode et options réunis. Menu, boissons et matériel présélectionnés, planning disponible mais non coché. Suppression du passage obligé par les QCM successifs.
- Quantités calibrées et arrondies aux conditionnements ; matériel individuel avec réserve, matériel commun séparé. Sources et hypothèses documentées dans `QUANTITES_BBQ.md`. Portions adultes ; enfants et menus mixtes restent à ajuster manuellement.
- Erreur réseau de création remplacée par une explication en français, saisie conservée à l'écran.
- Validation finale : 12 tests réussis et compilation de production réussie. Navigateur : question du nombre puis formulaire avec date, lieu et prénom conservés, mode et listes visibles ; génération des trois listes pour 20 personnes vérifiée (grillades 5 kg, salades 3 kg, légumes 2 kg, pain 5 baguettes, eau 14 bouteilles de 1,5 L, vaisselle 22). Base de calcul consultable avant création. Mise en production des changements de code en attente de fusion.

## Mode gratuit — correction du 28 septembre

Responsable : Codex. Branche `codex/free-event-mode`. Le mode par défaut utilise des règles françaises et des listes standard, sans appel externe de modèle ni clé requise. Le service Mistral reste bloqué ; il n'est pas présenté comme réparé. Un retour volontaire au fournisseur nécessite `PLANIFY_AI_MODE=external` côté serveur.

Fichiers : `lib/free-mode.mjs`, routes parse-voice/generate-list/recalculate-list, page create et tests. La conversation conserve prénom, lieu, date et heure entre les messages ; la réponse sur la date limite ne modifie pas la date de l'événement. Listes menu/boissons/matériel/cadeaux selon sélection ; quantités indicatives à modifier. Recalcul automatique indisponible dans ce mode, modification manuelle requise. Les checklists prédéfinies restent disponibles ; une activité sans checklist prédéfinie reçoit une erreur explicite.

Validation : 11 tests réussis et compilation de production réussie. Dans le navigateur local, le scénario BBQ à Chambéry → numa le 19 octobre → à 14H avance aux boutons de répartition sans boucler. Génération locale des trois listes BBQ vérifiée sans appel de modèle. Publication en production encore à effectuer ; aucun événement de test enregistré.
État actuel : PR nº 1 fusionnée par l'utilisateur, commit `e4354616d0dc15ac499dfe806c749ff31413a60c`, déploiement de production `dpl_Aq9eDrDsoKcL8Su3zF2ojLb5ayEQ` prêt sur `planify-e6eh`, associé au domaine planify.manoulabs.com. Sept icônes et formulaire BBQ vérifiés en production. La conversation affiche désormais l'erreur de quota au lieu de boucler. Mistral reste indisponible.
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

- 27 septembre 2026 — Vérification après fusion : domaine de production associé à planify-e6eh, version corrigée visible après rechargement. Essai de conversation sans création d'événement : erreur de limite IA explicite, texte conservé ; options BBQ accessibles. Inspection Mistral en lecture seule : organisation affichée Manou / Default Workspace, limites de modèles positives, aucune règle de quota workspace, plafond de dépenses désactivé, forfait gratuit indiquant 0 USD sur 10 USD inclus. Ces informations n'expliquent pas le refus effectif de l'API. Aucun achat, changement de clé, changement de fournisseur ou modification de quota effectué. Un diagnostic fournisseur ou une alternative autorisée reste nécessaire.

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

## 28 septembre 2026 — Invitations conviviales (branche codex/convivial-invitations)

- Appétit « gros mangeurs » : +30 % sur les aliments uniquement, distinct du style de recettes. Majoration explicitée dans les repères.
- Accroche personnalisable dans le formulaire BBQ, réutilisée dans le message de partage et l'invitation. Message WhatsApp sans emojis pour éviter les caractères cassés signalés. Le cache des anciens aperçus WhatsApp peut persister.
- Préférences alimentaires et listes à partager portent des titres distincts. Base de calcul ouverte par défaut, quantités directement modifiables.
- Option explicite pour autoriser des inscriptions au-delà du nombre prévu ; les anciens événements gardent leur limite. Les accompagnants sont inclus dans le total confirmé. L'organisateur doit compter son foyer dans les réponses.
- Tableau de bord BBQ : compléments calculés gratuitement pour le maximum entre prévision et confirmations. Les articles reconnus sont comparés aux quantités totales listées (réservées incluses). Pas de modification automatique des réservations ; ajouts à valider manuellement. Articles personnalisés à vérifier. L'ancien bouton BBQ de recalcul IA indisponible en mode gratuit est remplacé par ces repères.
- Rappel manuel : suppression du faux « dans 2 jours ». Agenda : fichier ICS proposé après confirmation, alertes la veille et 2 h avant ; l'invité doit l'importer et vérifier les alertes dans son application. Aucun envoi automatique WhatsApp/e-mail activé, choix du canal toujours à résoudre.
- Validation : 18 tests avec node --experimental-vm-modules --test tests/*.test.mjs ; compilation de production réussie. Navigateur sur données fictives : invitation, options BBQ et confirmation avec bouton agenda vérifiés. Génération complète du brouillon dans le navigateur interrompue par une perte de réponse du navigateur, calculs vérifiés par tests. Aucune donnée de production créée, aucun message envoyé.

## 28 septembre 2026 — Visibilité des ajouts invités

- Défaut identifié : ajout enregistré dans items, mais les autres pages ouvertes ne rechargeaient pas leurs listes.
- Actualisation des articles et listes toutes les 15 secondes sur les pages visibles, au retour sur l'onglet et à la reprise après une modification. Aucun rechargement du formulaire invité. Requêtes arrêtées au démontage, lectures suspendues pendant les mutations suivies ; données conservées en cas d'échec réseau.
- Libellé « Proposer cet article à tout le monde » : proposer reste distinct de réserver pour soi. Le commentaire est identifié comme destiné à l'organisateur et dirige vers l'ajout commun pour les apports.
- Validation : 19 tests réussis, compilation réussie, test navigateur local sur événement fictif : ajout Glaçons depuis invitation, affichage automatique dans le tableau de bord sans rechargement. Aucun événement de production modifié, aucun message envoyé.

## 29 septembre 2026 — Deux pavés pour les apports côté organisateur

- Liste « Reste à apporter » ouverte par défaut, noms et quantités restantes.
- Liste « Déjà réservé » ouverte par défaut, quantités et personne qui apporte ; prénom retrouvé par identifiant si nécessaire.
- Les deux pavés restent visibles pendant la modification, avec des messages explicites quand ils sont vides. Affichage empilé sur petit écran, deux colonnes sur grand écran. Utilise la synchronisation existante ; aucun changement des réservations.
- Validation : compilation réussie ; navigateur sur données fictives : Pain 5 baguettes restantes et Pain 2 baguettes réservées par Alex correctement séparés, aucune erreur console. Aucun événement réel modifié.
