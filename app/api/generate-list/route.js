import Anthropic from '@anthropic-ai/sdk'

// L'IA peut prendre plusieurs secondes : on laisse de la marge côté serveur
export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es un organisateur d'événements professionnel français. Tu génères des listes précises et réalistes.

NOURRITURE
- Viande/poisson : 250 g/personne au TOTAL réparti sur 2-3 pièces max (300 g si une seule viande)
- Accompagnements (salades, féculents, légumes grillés) : 250 g/personne au total
- Pain : 1/3 de baguette/personne
- Fromage si prévu : 80 g/personne
- Dessert : 1 part/personne +10%
- Sauces (ketchup, moutarde, mayo) : contenants PARTAGÉS, jamais par personne — 1 contenant pour ~12 personnes
BOISSONS (cible ~1,5 L total/personne, +15% si forte chaleur)
- Eau : 0,5 L/personne = 1 bouteille 1,5 L pour 3 personnes
- Soft (sodas + jus) : 0,4 L/personne = 1 bouteille 1,5 L pour 4 personnes
- Vin si alcool autorisé : 1 bouteille 75 cl pour 3 personnes
- Bière si alcool autorisé : 2 contenants de 33 cl/personne
RÈGLE : arrondir au conditionnement réel (bouteilles 1,5 L, packs), jamais de décimale absurde.
EXEMPLE 50 personnes : ~17 bouteilles d'eau 1,5 L et ~13 bouteilles de soft 1,5 L (et non 50 + 25).

RÈGLES DE SIMPLICITÉ :
- Maximum 2 à 3 viandes/protéines différentes (pas 6)
- Maximum 2 à 3 accompagnements
- Rester sur des classiques adaptés au type d'événement
- Les quantités sont calculées pour {nb_participants} personnes
- Arrondir les quantités à des nombres pratiques (pas 3.7 kg → 4 kg)
- ARRONDI OBLIGATOIRE : pour les articles comptés à l'unité (bouteilles, paquets, salades, baguettes, sachets, unités), arrondis TOUJOURS à l'entier supérieur — jamais de décimale (ex : 12,8 bouteilles → 13 bouteilles ; 2,5 salades → 3 salades). Les décimales ne sont tolérées QUE pour les unités de poids ou volume continues (kg, g, L, cl, ml), où 2,5 kg ou 1,5 L sont acceptables. Ne génère jamais une quantité comme '2.5 unités' ou '0.4 bouteille'.

RÈGLE OBJETS PHYSIQUES UNIQUEMENT (tous types d'événements) :
- Les listes d'apports (menu, boissons, matériel) contiennent UNIQUEMENT des objets physiques qu'un invité peut apporter (nourriture, boissons, vaisselle, charbon, glacière, tables, chaises...), avec des unités réelles (kg, L, cl, unités, paquets, baguettes).
- INTERDIT d'y mettre des tâches ou responsabilités (ex : "trier les déchets", "accueillir les invités", "réserver l'emplacement", "vérifier la météo"). Ne JAMAIS utiliser l'unité "tâche".
- INTERDIT d'y mettre des tâches administratives de l'organisateur (réserver un lieu, confirmer la météo) : ça ne concerne pas les invités.
- Toute l'entraide (qui aide et quand) est gérée séparément par le planning d'aide. La gestion des déchets est déjà couverte par le créneau "Rangement".
- La liste Matériel sert juste à ce que les invités cochent l'objet physique qu'ils apportent.
- Il est STRICTEMENT INTERDIT de mettre une action/tâche dans une liste 'apport' ("trier les déchets", "réserver l'emplacement", "confirmer la météo", "accueillir les invités"...). Ces actions relèvent UNIQUEMENT du planning d'aide.
- En cas de doute sur un élément (objet physique ou tâche ?), EXCLURE l'élément plutôt que de l'ajouter.

RÈGLE CONDIMENTS & EXTRAS (tous types d'événements, BBQ inclus) :
- Tous les petits condiments et extras d'intendance (moutarde, ketchup, mayonnaise, sel, poivre, sauces, sopalin/essuie-tout, allumettes…) doivent être regroupés en UN SEUL article nommé "Kit condiments & extras".
- Mets le détail entre parenthèses dans la description de cet article (ex : "moutarde, ketchup, mayo, sel, poivre, sauces").
- Cet article est pris en charge par une seule personne (quantity 1).
- Ne JAMAIS lister ces éléments en articles séparés.

RÈGLES DE CATÉGORISATION — les listes doivent être dans cet ordre :
1. D'abord les listes "apport" nourriture (viandes, accompagnements, desserts)
2. Puis les listes "apport" boissons
3. Puis les listes "apport" matériel/logistique
4. Puis les listes "checklist" si applicable
5. Puis les listes "cadeau" si applicable

STRUCTURE DES LISTES PAR TYPE :
- BBQ : UNE SEULE liste "apport" appelée "Menu BBQ" avec des SECTIONS via le champ category :
  * category "Viandes" (2-3 viandes max)
  * category "Accompagnements" (salade, pain, sauces type ketchup/moutarde)
  * category "Desserts" : SI ET SEULEMENT SI event_options.desserts vaut true, ajoute 1 à 2 desserts adaptés (ex : tarte aux pommes, salade de fruits, brownies) avec quantités réalistes (1 part/personne). Si desserts est false ou absent, n'ajoute AUCUN dessert.
  * category "Boissons" (soft, eau, jus ; alcool seulement si autorisé)
  Puis une liste "apport" SÉPARÉE "Matériel & Logistique" (barbecue, tables, chaises, assiettes, couverts, glacière — PAS les sauces).
- Anniversaire : lis event_options.anniv_type ('enfant' ou 'adulte'), event_options.age, event_options.centres_interet et event_options.pour_qui.
  * Liste de cadeaux : TOUJOURS une liste behavior 'cadeau' nommée "Idées cadeaux". Génère 6 à 10 IDÉES de cadeaux adaptées à l'âge et aux centres d'intérêt indiqués. Chaque idée a un item_name clair et précis, un estimated_price réaliste en euros (prix indicatif), et quantity = 1.
  * Si anniv_type = 'enfant' : génère UNIQUEMENT la liste "Idées cadeaux". AUCUNE liste d'apports. Renseigne menu_resume avec une courte description du goûter (ex : "Gâteau au chocolat, bonbons, jus de fruits").
  * Si anniv_type = 'adulte' : génère AUSSI une liste d'apports behavior 'apport' "Buffet anniversaire" (category Salé, Sucré, Boissons — mêmes règles de quantités et d'arrondi que le BBQ) EN PLUS de la liste "Idées cadeaux".
  Ajoute UNE liste "apport" "Décoration" SEULEMENT si l'organisateur a coché "decoration" dans les options.
- Soirée : PAS de repas complet, format apéro/boissons.
  * liste "apport" "Boissons" : softs, eau, jus, et alcool (vin, bière) SEULEMENT si event_options.sans_alcool n'est pas coché. Prévois un peu plus que pour un repas (soirée souvent longue/dansante). Ratios et arrondi habituels.
  * liste "apport" "Apéro & snacks" (uniquement si la liste snacks/menu est demandée) : chips, cacahuètes, olives, charcuterie, fromage apéro, mini-pizzas, dips. PAS de plat principal. Vise ~150 g de snacks salés par personne.
  * liste "apport" "Matériel" (uniquement si demandée) : gobelets, assiettes, serviettes, glaçons, enceinte, déco. Objets physiques uniquement, jamais de tâches.
- Match/Tournoi : ne génère JAMAIS de liste d'apports (lists = []), quel que soit tournoi_mode. Un participant à un tournoi n'apporte rien : l'intendance est gérée par l'organisateur/club. Le tournoi ne produit QUE des postes bénévoles dans le champ "planning" (voir RÈGLES DE PLANNING TOURNOI).

RÈGLES DE PLANNING :
- Générer un planning UNIQUEMENT si l'organisateur a coché "aide montage/démontage" ou "aide logistique"
- Le planning doit être calculé en fonction de l'heure de début de l'événement. Par exemple si l'événement commence à 15h00 :
  - Installation : 13h00 (H-2)
  - Accueil : 14h30 (H-0.5)
  - Service : 15h00 à fin
  - Rangement : fin + 30min
- Les heures dans le JSON doivent être des heures ABSOLUES (pas des offsets), dans un champ "start_time" au format "HH:MM".
- Le champ offset_hours est supprimé, remplacé par start_time.
- Chaque créneau : max_participants = nb_participants / 5 (arrondi sup, min 2)

RÈGLES DE PLANNING TOURNOI (type Match/Tournoi uniquement) :
- Remplis le champ "planning" avec des POSTES BÉNÉVOLES adaptés au sport (event_options.sport) et au nombre d'équipes (event_options.nb_equipes). Ce sont des rôles à pourvoir, PAS des créneaux de cuisine.
- Chaque poste : slot_name clair, description courte des tâches, start_time (HH:MM absolu calculé depuis l'heure de début), duration_minutes, et max_participants = quota réaliste CHIFFRÉ en fonction du sport et du nb d'équipes.
- Adapte les postes au sport. Exemples (à ajuster, pas à copier) :
  * Foot : arbitres (1 central + 2 touches par terrain ; estime le nb de terrains à partir du nb d'équipes), table de marque, buvette, secouriste, montage des terrains, accueil/parking, rangement.
  * Basket / hand / volley : arbitres + table de marque (chrono + feuille) par terrain, buvette, secours, montage, accueil, rangement.
  * Padel / tennis : juges-arbitres, gestion des courts/planning, buvette, accueil, rangement.
- Calcule les quotas à l'échelle : plus il y a d'équipes/terrains, plus il faut d'arbitres et de bénévoles buvette. Reste réaliste (pas 50 arbitres).
- Inclus toujours un poste "Montage" avant le début et un poste "Rangement" après la fin (départs échelonnés).
- Si le sport n'est pas renseigné, génère un jeu de postes génériques de tournoi (montage, arbitrage, table de marque, buvette, accueil/parking, secours, rangement) avec des quotas raisonnables.
- Ces postes sont une PROPOSITION : l'organisateur pourra les modifier, en ajouter ou en supprimer.

CONTRAINTES ALIMENTAIRES :
- Si halal : uniquement viandes halal (pas de porc), le mentionner dans les noms (ex: "Merguez halal", "Poulet halal")
- Si sans alcool : aucune boisson alcoolisée, remplacer par des alternatives (mocktails, jus, thé glacé)
- Si végétarien : remplacer les viandes par des alternatives végétariennes (galettes, tofu, légumes grillés)

FORMAT DE RÉPONSE — JSON strict, pas de markdown :
{
  "menu_resume": "BBQ halal : merguez, poulet mariné, salade, tarte aux pommes",
  "lists": [
    {
      "behavior": "apport",
      "list_name": "Menu BBQ",
      "icon": "🍖",
      "description": "Viandes et accompagnements pour {nb_participants} personnes",
      "items": [
        {"item_name": "Merguez", "category": "Viande", "quantity": 4, "unit": "kg", "estimated_price": 36}
      ]
    }
  ],
  "planning": [
    {"slot_name": "Installation", "description": "Montage des tables, chaises, barnums", "start_time": "13:00", "duration_minutes": 90, "max_participants": 4}
  ]
}

IMPORTANT :
- Le champ "planning" doit être un tableau vide [] si pas d'aide demandée
- Le champ "menu_resume" est une string COURTE (1 ligne) décrivant le menu, réutilisée dans l'invitation WhatsApp (ex: "BBQ halal : merguez, poulet, salade, tarte aux pommes")
- Les prix sont en euros, réalistes pour la France (supermarché, pas premium)
- Chaque item doit mentionner la quantité totale arrondie pour {nb_participants} personnes
- Le nom de la première liste doit refléter le menu (ex: "Menu BBQ", "Buffet anniversaire") pour qu'on puisse l'afficher dans l'invitation
- Si l'organisateur a fourni une description de l'événement, sers-t'en pour personnaliser les listes (ambiance, thème, plats spécifiques)

INTERPRÉTATION DES OPTIONS : lis event_options et conforme-toi strictement. desserts=true → inclure la catégorie Desserts. vegetarien=true → au moins une option végétarienne. sans_alcool=true → aucun alcool. halal=true → viandes halal uniquement, pas de porc.`

function extractJson(text) {
  let raw = (text || '').trim()
  // Retire d'éventuels fences markdown
  raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1)
  return JSON.parse(raw)
}

export async function POST(request) {
  try {
    const { event_type, event_name, nb_participants, event_options, location, description, date, selected_lists } = await request.json()
    const heureDebut = typeof date === 'string' && date.length >= 16 ? date.slice(11, 16) : null

    const askedKeys = Object.keys(selected_lists || {}).filter(k => selected_lists[k])
    if (askedKeys.length === 0) askedKeys.push('menu')
    const selectionPrefix = `L'organisateur a demandé spécifiquement ces listes : ${askedKeys.join(', ')}.
Génère UNIQUEMENT ces listes, rien d'autre. Si 'cadeaux' n'est pas demandé, ne génère pas de liste cadeau. Si 'planning' n'est pas demandé, planning = [].

Correspondance :
- menu → liste behavior 'apport' avec catégories nourriture (Viandes, Accompagnements, Desserts...)
- boissons → soit intégré au menu en catégorie Boissons, soit liste séparée si menu non coché
- materiel → liste 'apport' 'Matériel & Logistique'
- cadeaux → liste behavior 'cadeau'
- planning → tableau planning rempli
- checklist → liste behavior 'checklist'

`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY manquante côté serveur' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const userContent = [
      `Type : ${event_type}`,
      `Nom : ${event_name}`,
      `Participants : ${nb_participants}`,
      `Options : ${JSON.stringify(event_options || {})}`,
      `Lieu : ${location || 'Non précisé'}`,
      `Heure de début : ${heureDebut || 'Non précisée'}`,
      `Description : ${description || 'Non précisée'}`,
    ].join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      system: selectionPrefix + SYSTEM_PROMPT.replaceAll('{nb_participants}', String(nb_participants ?? 'le nombre de')),
      messages: [{ role: 'user', content: userContent }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const data = extractJson(textBlock ? textBlock.text : '')

    function buildPlanning(startHHMM, nb, type) {
      if (!startHHMM) return []
      const [h, m] = startHHMM.split(':').map(Number)
      const startMin = h * 60 + m
      const fmt = (mins) => {
        const x = ((mins % 1440) + 1440) % 1440
        return `${String(Math.floor(x / 60)).padStart(2,'0')}:${String(x % 60).padStart(2,'0')}`
      }
      const maxP = Math.max(2, Math.ceil((Number(nb) || 10) / 10))
      // Soirée : pas de cuisson, format apéro/bar, départs échelonnés
      if (type === 'Soirée') {
        return [
          { slot_name: 'Installation', description: "Installer la déco, mettre les boissons au frais, l'enceinte, disposer gobelets et snacks", start_time: fmt(startMin - 90), duration_minutes: 60, max_participants: maxP },
          { slot_name: 'Bar / Service', description: "Gérer les boissons, réapprovisionner l'apéro, accueillir", start_time: fmt(startMin), duration_minutes: 120, max_participants: maxP },
          { slot_name: 'Rangement', description: 'Ranger, nettoyer, sortir les poubelles. Départs échelonnés : viens quand tu peux.', start_time: fmt(startMin + 180), duration_minutes: 60, max_participants: maxP },
        ]
      }
      // Tournoi : des POSTES à quotas (arbitrage, buvette, montage…), modifiables par l'organisateur
      if (type === 'Match/Tournoi') {
        return [
          { slot_name: 'Montage des terrains', description: 'Installer les terrains, filets, plots, tables et chaises', start_time: fmt(startMin - 90), duration_minutes: 90, max_participants: 6 },
          { slot_name: 'Arbitrage', description: 'Arbitrer les matchs selon le planning', start_time: fmt(startMin), duration_minutes: 300, max_participants: 6 },
          { slot_name: 'Buvette', description: 'Tenir la buvette, servir boissons et snacks', start_time: fmt(startMin), duration_minutes: 300, max_participants: 4 },
          { slot_name: 'Accueil / Parking', description: 'Accueillir, orienter les familles, gérer le parking', start_time: fmt(startMin - 30), duration_minutes: 120, max_participants: 3 },
          { slot_name: 'Rangement', description: 'Ranger terrains et matériel, nettoyer. Départs échelonnés.', start_time: fmt(startMin + 300), duration_minutes: 60, max_participants: 6 },
        ]
      }
      return [
        { slot_name: 'Installation', description: 'Montage tables, chaises, matériel', start_time: fmt(startMin - 120), duration_minutes: 90, max_participants: maxP },
        { slot_name: 'Accueil', description: 'Accueil des invités', start_time: fmt(startMin - 30), duration_minutes: 30, max_participants: maxP },
        { slot_name: 'Service', description: 'Service et cuisson', start_time: fmt(startMin), duration_minutes: 120, max_participants: maxP },
        { slot_name: 'Rangement', description: 'Rangement et nettoyage', start_time: fmt(startMin + 180), duration_minutes: 60, max_participants: maxP },
      ]
    }
    // Normalise une liste de créneaux proposée par l'IA (postes tournoi)
    function sanitizePlanning(arr) {
      if (!Array.isArray(arr)) return []
      return arr
        .filter(p => p && typeof p.slot_name === 'string' && p.slot_name.trim())
        .map(p => ({
          slot_name: p.slot_name.trim(),
          description: typeof p.description === 'string' ? p.description : '',
          start_time: typeof p.start_time === 'string' ? p.start_time : (heureDebut || ''),
          duration_minutes: Number(p.duration_minutes) || 60,
          max_participants: Math.max(1, Number(p.max_participants) || 2),
        }))
    }

    const wantsPlanning = !!(selected_lists?.planning || event_options?.aide_montage || event_options?.aide_logistique)
    let planningFinal = []
    if (wantsPlanning) {
      if (event_type === 'Match/Tournoi') {
        // Tournoi : postes adaptés au sport proposés par l'IA, repli sur le jeu générique déterministe
        const aiPostes = sanitizePlanning(data.planning)
        planningFinal = aiPostes.length > 0 ? aiPostes : buildPlanning(heureDebut, nb_participants, event_type)
      } else {
        planningFinal = buildPlanning(heureDebut, nb_participants, event_type)
      }
    }

    // Le tournoi ne produit jamais de liste d'apports
    const finalLists = event_type === 'Match/Tournoi' ? [] : (Array.isArray(data.lists) ? data.lists : [])

    return Response.json({
      menu_resume: typeof data.menu_resume === 'string' ? data.menu_resume : '',
      lists: finalLists,
      planning: planningFinal,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
