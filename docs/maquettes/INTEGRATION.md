# Planify — Plan d'intégration des maquettes (à lancer après validation)

Préparé le 29 septembre 2026 sur la base de la PR #9. **Rien n'est intégré.** Ce plan décrit comment appliquer l'habillage aux pages existantes sans changer leur fonctionnement.

## Principe : changer l'apparence, pas le comportement

Pendant l'intégration, on ne touche à aucun de ces éléments :

- appels Supabase, noms de colonnes et de tables, aucune migration ;
- valeurs `rsvp_status` (`Confirmé`, `Peut-être`, `Refusé`) et `status` des articles (`Disponible`, `Réservé`) ;
- contrôle anti-dépassement au moment de l'envoi, blocage « complet », gestion des accompagnants dans le JSON `commentaire` ;
- ajout d'articles par les invités (`Suggestions des invités`) et rafraîchissement partagé (`useSharedItems`) ;
- vote repas via `event_options.meal_choices` et décompte par `nb_personnes` ;
- covoiturage, checklists outdoor, cadeaux (PR #8), planning bénévole, vue `?recap=1`, QR code ;
- `event_options` : aucun champ ajouté.

Les seules modifications autorisées : classes Tailwind, ordre d'affichage des blocs déjà présents, textes (voir `COPY_RECOMMENDATIONS.md`), et deux petits composants de présentation sans logique.

## Ordre de travail proposé (une branche, une PR)

Branche : `claude/mobile-ui-refresh`, partie de `main` **après fusion de la PR #9**, pour ne pas entrer en conflit avec `app/create/page.js` que Codex modifie.

| Étape | Fichier | Changement | Risque |
|---|---|---|---|
| 1 | `tailwind.config.js` | Ajouter `colors.cream: '#FFF8F1'` dans `extend` | Nul |
| 2 | `app/invite/[linkId]/InviteClient.js` | En-tête : dégradé clair selon le type (orange pour BBQ/Apéro, bleu pour tournoi…), titre plus grand, carte « Quand / Où / Réponse souhaitée ». Photo `photo_url` conservée. Fond `bg-cream`, cartes `rounded-3xl shadow-sm` | Faible (visuel) |
| 3 | idem | Ordre des boutons Oui / Peut-être / Non ; mêmes valeurs | Faible |
| 4 | idem | Barre d'envoi fixe en bas avec résumé calculé depuis l'état existant (`nbPersonnes`, articles sélectionnés) ; le bouton appelle le même `handleSubmit` | Moyen : vérifier que le formulaire reste soumis une seule fois et que la barre ne masque pas le dernier champ |
| 5 | idem | Articles réservés affichés grisés avec « Pris par … » ; étiquette « Idée d'un invité » pour `category === 'Suggestions des invités'` | Faible |
| 6 | idem (bloc `submitted`) | Titre « C'est noté, {prénom} ! », récap avec accompagnants, texte agenda honnête, bouton copier le lien | Faible |
| 7 | `app/event/[id]/page.js` | Compteurs en haut ; panneaux « Reste à apporter » / « Déjà réservé » un peu plus contrastés (bordure 2 px, compteur en pastille) ; libellé « Préparer une relance » + mention « Rien n'est envoyé automatiquement » | Faible |
| 8 | `lib/invitation.mjs` | Accroches par type dans `invitationHook` (l'accroche personnalisée reste prioritaire) | Faible, texte seul |
| 9 | `app/event/[id]/page.js` | Textes de `buildRelance`, `buildReminder`, `buildRecapFinal`, `buildInviteFamilies`, `buildMobilizeVolunteers` | Faible, texte seul |

Les étapes 8 et 9 modifient des messages envoyés aux invités : elles peuvent être validées séparément des étapes visuelles.

## Composants de présentation (sans logique)

```jsx
// app/components/ui.js — uniquement de l'affichage
export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-3xl shadow-sm p-4 ${className}`}>{children}</div>
}
export function Fact({ icon, label, children }) {
  return <div className="flex gap-3 rounded-2xl bg-white/70 px-3 py-2.5">
    <span aria-hidden="true">{icon}</span>
    <div><p className="text-xs font-bold uppercase tracking-wide text-stone-600">{label}</p>{children}</div>
  </div>
}
```

Correspondance des teintes d'en-tête (types internes inchangés) :

```js
const HERO = {
  BBQ: 'from-orange-100 to-orange-300', Apero: 'from-orange-100 to-orange-300',
  Anniversaire: 'from-rose-100 to-rose-300', 'Soirée': 'from-rose-100 to-rose-300',
  'Randonnée': 'from-teal-100 to-teal-300', 'Match/Tournoi': 'from-blue-100 to-blue-300',
  Autre: 'from-slate-100 to-slate-300',
}
```

## Vérifications avant de proposer la PR

1. `npm run build` sans erreur.
2. Parcours réels sur téléphone (375 px) : créer un BBQ, répondre Oui à 3 avec deux prénoms d'accompagnants, réserver un article, proposer un article, vérifier les deux panneaux côté organisateur.
3. Tournoi : repas activé puis désactivé à la création ; vote visible ou absent côté invité ; décompte dans le bilan.
4. Blocage « complet » et double envoi simultané toujours refusés.
5. Aperçu WhatsApp du lien et des messages de relance.
6. Mettre à jour `PROJECT_CONTEXT.md` (ce qui est fusionné, ce qui reste).

## Estimation

Environ 1 journée de travail assisté pour les étapes 1 à 7, une demi-journée pour 8-9 et les essais. Coût : 0 €.

## État au 29 septembre 2026 (branche `claude/mobile-ui-refresh`)

Maquette validée par le propriétaire. Intégration faite sur `claude/mobile-ui-refresh`, partie de `codex/outdoor-and-tournament-lists` (PR #9 encore ouverte) pour disposer des cinq catégories et du repas facultatif.

Réalisé :

- `lib/ui-theme.mjs` : teintes par catégorie et `formatQuantity` (affiche « 0,2 » au lieu de « 0.19999999999999996 », valeur stockée inchangée).
- `tailwind.config.js` : couleur `cream` et analyse de `lib/`.
- Invitation : en-tête coloré par catégorie, « X personnes ont déjà dit oui », boutons Oui / Peut-être / Non, accompagnants, liste d'apports avec quantités en pastille et « Pris par … », idée à la liste commune placée sous la liste, repas facultatif, case bénévole, barre d'envoi fixe avec résumé.
- Confirmation : récapitulatif (présence avec accompagnants, apports, créneaux, repas, bénévole), agenda avec texte honnête, copie du lien, contact WhatsApp de l'organisateur.
- Tableau organisateur : fond, compteurs oui / en attente / refus, panneaux « Reste à apporter » et « Déjà réservé » renforcés, étiquette « Idée d'un invité », libellés « Préparer une relance / le rappel / le récap final », boutons à contraste suffisant, fautes d'accents corrigées.
- Textes : accroches par type (`invitationHook`), messages d'invitation, familles, bénévoles, relance, rappel et récap final sans émoji, lien en dernière ligne.

Non modifié : requêtes Supabase, `event_options`, statuts, contrôle de places, JSON `commentaire`, ajouts partagés, covoiturage, cadeaux, checklists, planning bénévole.

Vérifications : `npm run build` réussi ; tests existants 19/19 (`node --experimental-vm-modules --test`) ; parcours à 375 px sur une base Supabase simulée en local (réponse BBQ à 2 avec accompagnant, ajout et réservation d'une idée, réponse tournoi à 3 avec repas et bénévole, tableaux BBQ et tournoi, message de relance, vue `?recap=1`, blocage « complet ») sans erreur ni défilement horizontal. Essai sur la vraie base Supabase et sur un téléphone réel à faire sur l'aperçu Vercel de la PR.

Points laissés à Codex (fonctionnel) :

- Tournoi : le bloc « Ajouter une idée à la liste commune », le bouton « Modifier la liste de courses » et les deux panneaux vides restent affichés alors qu'il n'y a pas de liste d'apports.
- Réservation partielle : le reste d'un article est stocké avec des décimales parasites (ex. 0.19999999999999996 kg) ; l'affichage est corrigé, la valeur enregistrée ne l'est pas.
