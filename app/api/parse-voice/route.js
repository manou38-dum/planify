import Anthropic from '@anthropic-ai/sdk'

// Extraction légère : on laisse un peu de marge mais ça reste rapide
export const maxDuration = 30

// Valeurs autorisées pour le type d'événement (doivent coïncider avec EVENT_TYPES de create/page.js)
const EVENT_TYPES = ['BBQ', 'Anniversaire', 'Randonnée', 'Soirée', 'Match/Tournoi', 'Apero', 'Autre']

const SYSTEM_PROMPT = `Tu extrais des informations d'une phrase française décrivant un événement. Réponds UNIQUEMENT avec un objet JSON valide, sans texte ni backticks. N'invente jamais : tout champ non mentionné est absent.

Champs possibles (n'inclus QUE ceux réellement présents dans la phrase) :
- event_type : exactement une de ces valeurs : "BBQ", "Anniversaire", "Randonnée", "Soirée", "Match/Tournoi", "Apero", "Autre".
- date : date et heure au format "YYYY-MM-DDTHH:MM" (ex : "2026-07-04T15:00"). Résous les dates relatives ("samedi prochain", "demain", "le 4 juillet") à partir de la date du jour fournie. Si une date est donnée sans heure, mets "12:00".
- nb_participants : entier (nombre de personnes attendues).
- location : chaîne (le lieu).
- organizer_name : chaîne (le prénom de l'organisateur, s'il est mentionné).

Exemple de réponse valide : {"event_type":"BBQ","nb_participants":25,"location":"chez Thomas"}`

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
    const { transcript } = await request.json()
    if (!transcript || !String(transcript).trim()) return Response.json({})

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return Response.json({})

    const anthropic = new Anthropic({ apiKey })

    // On fournit la date du jour pour résoudre les dates relatives ("samedi prochain")
    const today = new Date().toISOString().slice(0, 10)
    const userContent = `Date du jour : ${today}\nPhrase : ${String(transcript).trim()}`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const data = extractJson(textBlock ? textBlock.text : '')

    // On ne renvoie que des champs propres et valides (le client ne remplit que le non-null)
    const out = {}
    if (typeof data.event_type === 'string' && EVENT_TYPES.includes(data.event_type)) {
      out.event_type = data.event_type
    }
    if (typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(data.date)) {
      out.date = data.date.slice(0, 16)
    }
    if (data.nb_participants != null && Number.isFinite(Number(data.nb_participants))) {
      const n = Math.round(Number(data.nb_participants))
      if (n > 0) out.nb_participants = n
    }
    if (typeof data.location === 'string' && data.location.trim()) {
      out.location = data.location.trim()
    }
    if (typeof data.organizer_name === 'string' && data.organizer_name.trim()) {
      out.organizer_name = data.organizer_name.trim()
    }

    return Response.json(out)
  } catch (err) {
    // Extraction best-effort : en cas d'erreur on ne pré-remplit rien
    return Response.json({})
  }
}
