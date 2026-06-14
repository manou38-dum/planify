import Anthropic from '@anthropic-ai/sdk'

// L'IA peut prendre plusieurs secondes : on laisse de la marge côté serveur
export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es un assistant expert en organisation d'événements. Génère les listes nécessaires pour cet événement.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks, avec cette structure :
{
  "lists": [
    {
      "behavior": "apport",
      "list_name": "Courses",
      "icon": "🛒",
      "description": "Ce qu'il faut acheter ou apporter",
      "items": [
        {"item_name": "...", "category": "Nourriture", "quantity": 2, "unit": "kg", "estimated_price": 15}
      ]
    },
    {
      "behavior": "checklist",
      "list_name": "Matériel obligatoire",
      "icon": "📋",
      "description": "Chaque participant doit vérifier qu'il a tout",
      "items": [
        {"item_name": "Chaussures de rando", "category": "Équipement", "quantity": 1, "unit": "paire", "estimated_price": 0}
      ]
    },
    {
      "behavior": "cadeau",
      "list_name": "Idées cadeaux",
      "icon": "🎁",
      "description": "Réserve un cadeau (les autres ne verront pas lequel)",
      "items": []
    }
  ],
  "planning": [
    {"slot_name": "Installation", "description": "Montage tables et barnums", "duration_minutes": 60, "max_participants": 4, "offset_hours": -2},
    {"slot_name": "Rangement", "description": "Démontage et nettoyage", "duration_minutes": 60, "max_participants": 4, "offset_hours": 4}
  ]
}

Adapte les listes au type d'événement :
- BBQ : liste apport (viandes, boissons, accompagnements, matériel BBQ). Si halal, adapter. Si sans alcool, pas d'alcool. Si aide montage, ajouter planning.
- Anniversaire : liste apport (nourriture, boissons, déco). Si liste cadeaux, ajouter une liste behavior=cadeau adaptée à l'âge et centres d'intérêt.
- Randonnée : liste apport (pique-nique). Checklist matériel obligatoire (chaussures, eau 1.5L, crème solaire, couverture survie, sifflet, lampe frontale). Checklist vêtements.
- Mariage : listes apport (apéro, plat, dessert, déco). Si cadeaux, liste cadeau. Si aide logistique, planning.
- Soirée : liste apport (boissons, snacks, sono). Si aide, planning.
- Match : liste apport (boissons, snacks post-match, matériel sportif).
- Autre : génère les listes les plus pertinentes selon la description.

Le planning n'est généré que si l'événement le justifie (aide montage, logistique, etc).
Les prix estimés doivent être réalistes pour la France.
Adapte les quantités au nombre de participants.`

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
    const { event_type, event_name, nb_participants, event_options, location } = await request.json()

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
    ].join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const data = extractJson(textBlock ? textBlock.text : '')

    return Response.json({
      lists: Array.isArray(data.lists) ? data.lists : [],
      planning: Array.isArray(data.planning) ? data.planning : [],
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
