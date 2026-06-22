import Anthropic from '@anthropic-ai/sdk'

// L'IA peut prendre quelques secondes : on laisse de la marge côté serveur
export const maxDuration = 60

// Recalcul SEUL : on garde la liste d'articles telle quelle, on ne touche QUE les quantités.
const SYSTEM_PROMPT = `Tu es un organisateur d'événements français. On te donne une liste d'articles d'apport DÉJÀ ÉTABLIE par l'organisateur et un nombre de personnes. Ta SEULE tâche est de RECALCULER la quantité de chaque article pour couvrir ce nombre de personnes.

RÈGLES ABSOLUES :
- Garde EXACTEMENT la même liste d'articles : même nombre d'articles, mêmes item_name, mêmes unit, mêmes category. N'ajoute AUCUN article, n'en supprime AUCUN, n'en renomme AUCUN, n'en inventes AUCUN. Si l'organisateur a supprimé une viande, NE LA RÉAJOUTE PAS.
- Recalcule UNIQUEMENT le champ quantity de chaque article.
- Répartis les quantités sur les articles RÉELLEMENT PRÉSENTS dans la liste. Exemple : si une seule viande reste (au lieu de 3), elle doit à elle seule couvrir le besoin total en viande (~300 g/personne), pas un tiers.

RATIOS PAR PERSONNE :
- Viande/poisson : 250 g/personne au TOTAL réparti sur les viandes présentes (300 g si une seule viande dans la liste)
- Accompagnements (salades, féculents, légumes) : 250 g/personne au total réparti sur les accompagnements présents
- Pain : 1/3 de baguette/personne
- Fromage : 80 g/personne
- Dessert : 1 part/personne +10%
- Eau : 0,5 L/personne (bouteilles 1,5 L → 1 bouteille pour 3 personnes)
- Soft (sodas + jus) : 0,4 L/personne (bouteilles 1,5 L → 1 bouteille pour 4 personnes)
- Vin : 1 bouteille 75 cl pour 3 personnes
- Bière : 2 contenants de 33 cl/personne
- Snacks salés (apéro) : ~150 g/personne au total réparti sur les snacks présents
- Sauces / condiments / kit partagé : contenant PARTAGÉ, 1 contenant pour ~12 personnes (jamais par personne)

ARRONDI OBLIGATOIRE :
- Articles comptés à l'unité (bouteilles, paquets, salades, baguettes, sachets, unités) : arrondis TOUJOURS à l'entier supérieur, jamais de décimale.
- Décimales tolérées UNIQUEMENT pour les unités de poids/volume continues (kg, g, L, cl, ml).

FORMAT DE RÉPONSE — JSON strict, sans markdown. Renvoie un objet par article reçu, DANS LE MÊME ORDRE, avec son item_name inchangé et sa nouvelle quantity :
{ "items": [ {"item_name": "Merguez", "quantity": 15} ] }`

function extractJson(text) {
  let raw = (text || '').trim()
  raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1)
  return JSON.parse(raw)
}

export async function POST(request) {
  try {
    const { event_type, nb_participants, event_options, items } = await request.json()

    const list = Array.isArray(items) ? items.filter(it => it && (it.item_name || '').trim()) : []
    if (list.length === 0) {
      return Response.json({ error: 'Aucun article à recalculer' }, { status: 400 })
    }
    const nb = Number(nb_participants)
    if (!Number.isFinite(nb) || nb < 1) {
      return Response.json({ error: 'Nombre de personnes invalide' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY manquante côté serveur' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const userContent = [
      `Type d'événement : ${event_type || 'Non précisé'}`,
      `Nombre de personnes à couvrir : ${nb}`,
      `Options : ${JSON.stringify(event_options || {})}`,
      `Liste d'articles actuelle (recalcule la quantity de chacun, garde la même liste) :`,
      JSON.stringify(list.map(it => ({
        item_name: it.item_name,
        unit: it.unit || '',
        category: it.category || '',
        quantity: it.quantity ?? null,
      }))),
    ].join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const data = extractJson(textBlock ? textBlock.text : '')
    const outItems = Array.isArray(data.items) ? data.items : []

    return Response.json({ items: outItems })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
