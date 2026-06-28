import Anthropic from '@anthropic-ai/sdk'

// Extraction légère : on laisse un peu de marge mais ça reste rapide
export const maxDuration = 30

// Valeurs autorisées pour le type d'événement (doivent coïncider avec EVENT_TYPES de create/page.js)
const EVENT_TYPES = ['BBQ', 'Anniversaire', 'Randonnée', 'Soirée', 'Match/Tournoi', 'Apero', 'Autre']

// Champs importants à compléter, par ordre de priorité (pilotent les questions de suivi)
const IMPORTANT_FIELDS = ['date', 'location', 'organizer_name', 'organizer_phone', 'deadline_rsvp']

// Options booléennes du BBQ que l'on sait extraire
const BBQ_OPTION_KEYS = ['halal', 'vegetarien', 'sans_alcool', 'desserts']

// Format des champs datetime-local du formulaire (date et deadline_rsvp)
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

const SYSTEM_PROMPT = `Tu aides à remplir le formulaire de création d'un événement à partir de phrases dictées en français. Réponds UNIQUEMENT avec un objet JSON valide, sans texte ni backticks.

On te fournit : la date du jour (pour les dates relatives), l'état actuel des champs déjà connus (JSON "current", purement informatif — il peut contenir des valeurs par défaut), et une phrase dictée par l'organisateur.

1) EXTRACTION — TON RÔLE PRINCIPAL. Extrais TOUJOURS de la phrase tous les champs qu'elle exprime, même si "current" contient déjà des valeurs. N'inclus QUE les champs réellement exprimés dans la phrase, n'invente jamais :
- event_type : exactement une de ces valeurs : "BBQ", "Anniversaire", "Randonnée", "Soirée", "Match/Tournoi", "Apero", "Autre".
- date : date + heure de l'événement, format "YYYY-MM-DDTHH:MM". Résous les dates relatives ("samedi prochain", "demain") depuis la date du jour. Si l'organisateur ne donne QUE l'heure (ex : "18h", "à 15h30") et qu'une date existe déjà dans current.date, FUSIONNE : garde le jour de current.date et remplace seulement l'heure. Si une date est donnée SANS aucune heure précise, mets l'heure à "00:00" (minuit) pour signaler que l'heure n'a pas été dite.
- nb_participants : entier (nombre de personnes).
- location : chaîne (le lieu : "chez moi", "chez Thomas", une adresse, un parking...).
- organizer_name : prénom de l'organisateur.
- organizer_phone : numéro de téléphone de l'organisateur.
- deadline_rsvp : date limite de réponse / relance des invités, format "YYYY-MM-DDTHH:MM". Souvent relative à la date de l'événement (ex : "2 jours avant", "une semaine avant" → date de l'événement moins ce délai ; utilise current.date ou la date que tu viens d'extraire). Si seule une date est donnée sans heure, mets "12:00".
- options : objet des options BBQ que l'utilisateur a EXPLICITEMENT adressées, en booléens, parmi : halal, vegetarien, sans_alcool, desserts. N'inclus QUE les clés réellement évoquées. Exemples : "oui halal" → {"halal":true} ; "pas de dessert" → {"desserts":false} ; "avec alcool" → {"sans_alcool":false} ; "que du végé" → {"vegetarien":true} ; "sans alcool" → {"sans_alcool":true} ; "on prévoit un dessert" → {"desserts":true}.

Interprète TOUJOURS la phrase EN CONTEXTE de current : c'est souvent une réponse courte à une question (juste une heure, un lieu, un numéro...).

2) QUESTION DE SUIVI — calcule mentalement l'état après mise à jour (current + ce que tu viens d'extraire). Parmi les champs importants ENCORE VIDES, dans cet ordre de priorité — date (avec l'heure), location, organizer_name, organizer_phone, deadline_rsvp — rédige "follow_up_question" : UNE seule question en français, naturelle, chaleureuse et conversationnelle, qui regroupe 2 à 3 de ces champs vides (les plus prioritaires). VARIE la formulation à chaque fois, ne répète jamais deux fois la même phrase. Si plus aucun de ces champs n'est vide, mets "follow_up_question": null.

Exemples de ton (NE PAS recopier, varie à chaque fois) :
- "Super ! Il me manque juste l'heure et le lieu — ça se passe où et ça démarre à quelle heure ?"
- "Génial 🎉 Dis-moi qui organise et à quel numéro on peut te joindre ?"

FORMAT (exemple) : {"date":"2026-07-04T18:00","location":"chez moi","follow_up_question":"..."}`

function extractJson(text) {
  let raw = (text || '').trim()
  // Retire d'éventuels fences markdown
  raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1)
  return JSON.parse(raw)
}

// Mode FORMULATION : formule UNE question chaleureuse et variée regroupant les options BBQ encore non répondues
async function formulateOptionsQuestion(anthropic, labels) {
  try {
    const system = `Tu poses UNE seule question française, naturelle, chaleureuse et variée pour finaliser un barbecue. Réponds UNIQUEMENT avec un JSON {"follow_up_question":"..."} sans texte ni backticks. Regroupe en une question fluide toutes les options listées (présentées comme de simples choix oui/non), sans en oublier. Varie la formulation, reste bref et amical.`
    const user = `Options à couvrir : ${labels.join(', ')}`
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      temperature: 0.7,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const tb = message.content.find(b => b.type === 'text')
    const d = extractJson(tb ? tb.text : '')
    if (typeof d.follow_up_question === 'string' && d.follow_up_question.trim()) return d.follow_up_question.trim()
  } catch (err) {
    // repli déterministe côté client
  }
  return null
}

export async function POST(request) {
  try {
    const { transcript, current, pending_options } = await request.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return Response.json({ follow_up_question: null })

    const anthropic = new Anthropic({ apiKey })

    // Mode FORMULATION : juste une question sur les options encore non répondues (pas d'extraction)
    if (Array.isArray(pending_options) && pending_options.length > 0) {
      const followUp = await formulateOptionsQuestion(anthropic, pending_options.map(String))
      return Response.json({ follow_up_question: followUp })
    }

    if (!transcript || !String(transcript).trim()) return Response.json({ follow_up_question: null })

    const cur = current && typeof current === 'object' ? current : {}
    // On fournit la date du jour pour résoudre les dates relatives, et l'état courant pour le contexte
    const today = new Date().toISOString().slice(0, 10)
    const curForModel = {
      event_type: cur.event_type || null,
      date: cur.date || null,
      nb_participants: cur.nb_participants ?? null,
      location: cur.location || null,
      organizer_name: cur.organizer_name || null,
      organizer_phone: cur.organizer_phone || null,
      deadline_rsvp: cur.deadline_rsvp || null,
    }
    const userContent = [
      `Date du jour : ${today}`,
      `current : ${JSON.stringify(curForModel)}`,
      `Phrase : ${String(transcript).trim()}`,
    ].join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const data = extractJson(textBlock ? textBlock.text : '')

    // On ne renvoie que des champs propres et valides (le client gère l'écrasement)
    const out = {}
    if (typeof data.event_type === 'string' && EVENT_TYPES.includes(data.event_type)) {
      out.event_type = data.event_type
    }
    if (typeof data.date === 'string' && DATETIME_RE.test(data.date)) {
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
    if (typeof data.organizer_phone === 'string' && data.organizer_phone.trim()) {
      out.organizer_phone = data.organizer_phone.trim()
    }
    if (typeof data.deadline_rsvp === 'string' && DATETIME_RE.test(data.deadline_rsvp)) {
      out.deadline_rsvp = data.deadline_rsvp.slice(0, 16)
    }
    // Options BBQ explicitement adressées (booléens uniquement)
    if (data.options && typeof data.options === 'object') {
      const opts = {}
      for (const k of BBQ_OPTION_KEYS) {
        if (typeof data.options[k] === 'boolean') opts[k] = data.options[k]
      }
      if (Object.keys(opts).length) out.options = opts
    }

    // Garde-fou : on ne pose une question que s'il reste vraiment un champ important vide après mise à jour
    const merged = { ...curForModel, ...out }
    const stillEmpty = IMPORTANT_FIELDS.some(f => !merged[f])
    out.follow_up_question = stillEmpty && typeof data.follow_up_question === 'string' && data.follow_up_question.trim()
      ? data.follow_up_question.trim()
      : null

    return Response.json(out)
  } catch (err) {
    // Best-effort : en cas d'erreur on ne pré-remplit rien et on ne pose pas de question
    return Response.json({ follow_up_question: null })
  }
}
