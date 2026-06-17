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
  * category "Desserts" (1-2 desserts — uniquement si les desserts sont demandés)
  * category "Boissons" (soft, eau, jus ; alcool seulement si autorisé)
  Puis une liste "apport" SÉPARÉE "Matériel & Logistique" (barbecue, tables, chaises, assiettes, couverts, glacière — PAS les sauces).
- Anniversaire : UNE liste "apport" "Buffet anniversaire" avec les category Salé, Sucré, Boissons (fusionner goûter/dessert/boisson).
  Ajoute UNE liste "apport" "Décoration" SEULEMENT si l'organisateur a coché "decoration" dans les options.
  Ajoute UNE liste "cadeau" SEULEMENT si "liste_cadeaux" est coché (adapte à l'âge et aux centres d'intérêt).

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
- Si l'organisateur a fourni une description de l'événement, sers-t'en pour personnaliser les listes (ambiance, thème, plats spécifiques)`

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

    function buildPlanning(startHHMM, nb) {
      if (!startHHMM) return []
      const [h, m] = startHHMM.split(':').map(Number)
      const startMin = h * 60 + m
      const fmt = (mins) => {
        const x = ((mins % 1440) + 1440) % 1440
        return `${String(Math.floor(x / 60)).padStart(2,'0')}:${String(x % 60).padStart(2,'0')}`
      }
      const maxP = Math.max(2, Math.ceil((Number(nb) || 10) / 10))
      return [
        { slot_name: 'Installation', description: 'Montage tables, chaises, matériel', start_time: fmt(startMin - 120), duration_minutes: 90, max_participants: maxP },
        { slot_name: 'Accueil', description: 'Accueil des invités', start_time: fmt(startMin - 30), duration_minutes: 30, max_participants: maxP },
        { slot_name: 'Service', description: 'Service et cuisson', start_time: fmt(startMin), duration_minutes: 120, max_participants: maxP },
        { slot_name: 'Rangement', description: 'Rangement et nettoyage', start_time: fmt(startMin + 180), duration_minutes: 60, max_participants: maxP },
      ]
    }
    const wantsPlanning = !!(selected_lists?.planning || event_options?.aide_montage || event_options?.aide_logistique)
    const planningFinal = wantsPlanning ? buildPlanning(heureDebut, nb_participants) : []

    return Response.json({
      menu_resume: typeof data.menu_resume === 'string' ? data.menu_resume : '',
      lists: Array.isArray(data.lists) ? data.lists : [],
      planning: planningFinal,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
