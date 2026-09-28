// Mode sans appel externe : aucune clé API et aucun coût de modèle.
import { menuInspiration } from './menu-inspirations.mjs'
export const useFreeMode = () => process.env.PLANIFY_AI_MODE !== 'external'
const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const months = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
const days = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']
const iso = d => d.toISOString().slice(0, 10)

export function parseFreeEvent(transcript, current = {}, today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date()), pendingField = null) {
  const raw = String(transcript || '').trim()
  const text = fold(raw)
  const out = { source: 'local', follow_up_question: null }
  const types = [[/\bbbq\b|barbecue/, 'BBQ'], [/anniversaire|\banniv\b/, 'Anniversaire'], [/randonnee|\brando\b|\bvtt\b|sortie|velo/, 'Randonnée'], [/soiree/, 'Soirée'], [/tournoi|\bmatch\b/, 'Match/Tournoi'], [/apero/, 'Apero']]
  for (const [pattern, type] of types) if (pattern.test(text)) { out.event_type = type; break }
  const count = text.match(/\b(\d+)\s*(?:personnes?|convives?|invites?|participants?)\b/)
    || (!Number(current.nb_participants) && text.match(/^\s*(\d+)\s*$/))
  if (count && Number(count[1]) > 0) out.nb_participants = Number(count[1])
  const place = raw.match(/\bchez\s+.+?(?=\s+(?:le\s+\d|pour\s+\d|[àa]\s+\d{1,2}\s*[hH])|[.!?]|$)/i)
    || raw.match(/(?:^|\s)[àa]\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]*?)(?=\s+(?:le\s+\d|pour\s+\d)|[.!?]|$)/)
  if (place) out.location = (place[1] || place[0]).trim()
  const explicitName = raw.match(/(?:je m['’]appelle|moi c['’]est|mon pr[ée]nom est)\s+([A-Za-zÀ-ÿ'-]+)/i)
  const shortName = raw.match(/^([A-Za-zÀ-ÿ'-]+)(?:\s*,?\s+le\s+\d|$)/)
  if (explicitName) out.organizer_name = explicitName[1]
  else if (!current.organizer_name && shortName && !/^(bonjour|salut|oui|non|bbq|barbecue|samedi|dimanche|lundi|mardi|mercredi|jeudi|vendredi|demain|aujourd'hui|apero|soiree|anniversaire)$/i.test(fold(shortName[1]))) out.organizer_name = shortName[1]

  const base = new Date(`${today}T12:00:00Z`)
  let day = null
  const named = text.match(new RegExp('\\b(\\d{1,2})\\s+(' + months.join('|') + ')(?:\\s+(20\\d{2}))?\\b'))
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b/)
  if (named || numeric) {
    const match = named || numeric
    const month = named ? months.indexOf(match[2]) : Number(match[2]) - 1
    let year = Number(match[3]) || base.getUTCFullYear()
    let d = new Date(Date.UTC(year, month, Number(match[1]), 12))
    if (!match[3] && d < base) d = new Date(Date.UTC(++year, month, Number(match[1]), 12))
    if (d.getUTCMonth() === month && d.getUTCDate() === Number(match[1])) day = iso(d)
  } else {
    const weekday = days.findIndex(d => new RegExp('\\b' + d + '\\b').test(text))
    let offset = null
    if (/apres[- ]demain/.test(text)) offset = 2
    else if (/\bdemain\b/.test(text)) offset = 1
    else if (/aujourd['’]hui/.test(text)) offset = 0
    else if (weekday >= 0) offset = (weekday - base.getUTCDay() + 7) % 7 || 7
    if (offset != null) { base.setUTCDate(base.getUTCDate() + offset); day = iso(base) }
  }
  const time = text.match(/\b(\d{1,2})\s*(?:h|:)(\d{2})?\b/)
  const hour = time ? Number(time[1]) : /\bmidi\b/.test(text) ? 12 : null
  const minute = time ? Number(time[2] || 0) : 0
  const validTime = hour != null && hour < 24 && minute < 60
  if (day || (validTime && current.date)) {
    out.date = `${day || current.date.slice(0, 10)}T${validTime ? String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0') : '00:00'}`
  }
  if (pendingField === 'deadline_rsvp') {
    const relative = text.match(/\b(\d+)\s+jours?\s+avant\b/)
    if (relative && current.date) {
      const deadline = new Date(`${current.date.slice(0, 10)}T12:00:00Z`)
      deadline.setUTCDate(deadline.getUTCDate() - Number(relative[1]))
      return { source: 'local', follow_up_question: null, deadline_rsvp: `${iso(deadline)}T12:00` }
    }
    return { source: 'local', follow_up_question: null, ...(out.date ? { deadline_rsvp: out.date.replace('T00:00', 'T12:00') } : {}) }
  }
  const effective = { ...current, ...out }
  const missing = []
  if (!effective.organizer_name) missing.push('ton prénom')
  if (!effective.date) missing.push('la date')
  else if (effective.date.slice(11,16) === '00:00') missing.push("l'heure")
  if (!effective.location) missing.push('le lieu')
  if (effective.event_type !== 'Apero' && !Number(effective.nb_participants)) missing.push('le nombre de personnes (toi compris)')
  if (missing.length) out.follow_up_question = `Il me manque ${missing.join(', ')}. Tu peux aussi compléter directement le formulaire avec les boutons ci-dessus.`
  return out
}

export function freeLists(keys, count, options = {}, type = '') {
  const n = Math.max(1, Math.min(10000, Number(count) || 1))
  const item = (item_name, quantity, unit, category) => ({ item_name, quantity, unit, category })
  const appetite = options.appetite === 'generous' ? 1.3 : 1
  const kg = grams => Math.ceil(n * grams * appetite / 100) / 10
  const spare = Math.ceil(n * 1.1)
  const lists = []
  const add = (list_name, icon, items, behavior = 'apport') => lists.push({ list_name, icon, behavior, description: 'Suggestion standard gratuite : à vérifier et modifier selon vos besoins.', items })
  if (keys.includes('menu')) {
    const inspiration = menuInspiration(options)
    const food = [item('Salade de pâtes ou pommes de terre préparée', kg(150), 'kg', 'Accompagnements'), item('Crudités ou légumes à griller', kg(100), 'kg', 'Accompagnements'), item('Pain', Math.ceil(n * appetite / 4), 'baguettes de 250 g', 'Accompagnements')]
    if (type === 'BBQ') {
      food[0].item_name = inspiration.salad
      food[1].item_name = inspiration.vegetables
    }
    if (type === 'BBQ') {
      food.unshift(item(options.vegetarien ? 'Protéines végétales à griller' : options.halal ? 'Assortiment de grillades halal (sans os)' : 'Assortiment de grillades (sans os)', kg(options.vegetarien ? 200 : 250), 'kg', 'Grillades'))
      food.push(item('Sauces et condiments', Math.ceil(n * appetite * 30 / 250), 'pots de 250 g', 'Condiments'))
    }
    if (options.desserts) food.push(item('Dessert au choix', Math.ceil(n * appetite), 'parts', 'Desserts'))
    add('Menu à personnaliser', '🍽', food)
  }
  if (keys.includes('boissons')) add('Boissons sans alcool', '🥤', [item('Eau (prévoir davantage selon chaleur et durée)', Math.ceil(n / 1.5), 'bouteilles de 1,5 L', 'Boissons'), item('Jus de fruits ou boissons fraîches', Math.ceil(n * 0.25 / 1.5), 'bouteilles de 1,5 L', 'Boissons')])
  if (keys.includes('materiel')) {
    const equipment = [item('Assiettes réutilisables', spare, 'unités', 'Vaisselle'), item('Verres réutilisables', spare, 'unités', 'Vaisselle'), item('Couverts', spare, 'jeux', 'Vaisselle'), item('Serviettes', n * 2, 'unités', 'Vaisselle')]
    if (options.desserts) equipment.push(item('Petites assiettes pour les desserts', spare, 'unités', 'Vaisselle'))
    if (type === 'BBQ') equipment.push(item('Pinces distinctes pour cru et cuit', 2, 'unités', 'Cuisson'), item('Plats de service', Math.max(2, Math.ceil(n / 8)), 'unités', 'Service'), item('Sacs de tri', Math.max(2, Math.ceil(n / 10)), 'unités', 'Nettoyage'))
    add('Matériel à vérifier avant achat', '📦', equipment)
  }
  if (keys.includes('cadeaux')) add('Idées à remplacer par tes cadeaux', '🎁', [item('Cadeau à préciser par l’organisateur', 1, 'unité', 'Cadeaux')], 'cadeau')
  return { lists, planning: [], menu_resume: `Base pour ${n} personnes (portions adultes). ${appetite > 1 ? 'Gros mangeurs : aliments +30 %, hors boissons et matériel. Repères standards avant majoration :' : 'Repères par personne :'} ${options.vegetarien ? '200 g de protéines végétales' : '250 g de grillades sans os'} pour un BBQ, 150 g de salade de féculents préparée, 100 g de légumes et ¼ de baguette par personne. Eau : 1 L/personne ; autres boissons sans alcool : 25 cl/personne. Vaisselle : 1/personne + 10 % de réserve, 2 serviettes/personne. Quantités arrondies aux conditionnements. Réduis selon les enfants et les appétits ; adapte selon durée, chaleur, régimes et allergies. Alcool à ajouter manuellement selon les adultes concernés. Vérifie le matériel déjà disponible et le combustible adapté à ton barbecue. Mode gratuit sans IA.` }
}
