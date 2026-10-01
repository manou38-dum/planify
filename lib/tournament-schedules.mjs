// Grilles simples pour rencontres amicales : aucune donnée sensible ni appel externe.
// Deux formats :
// - « mêlée » : les équipes sont retirées à chaque rotation, en limitant les partenaires puis les
//   adversaires déjà rencontrés ; ceux qui se reposent tournent équitablement ;
// - « équipes fixes » : championnat où chaque équipe rencontre toutes les autres une fois, rangé en
//   créneaux qui remplissent tous les terrains disponibles ; aucun match n'est perdu.
// Le tirage est déterministe : mêmes joueurs et mêmes réglages = même grille.

const MAX_ROTATIONS = 8
const ESSAIS_PAR_ROTATION = 400

// Générateur pseudo-aléatoire initialisé par une chaîne (FNV-1a + mulberry32).
function seededRandom(seed) {
  let h = 2166136261 >>> 0
  for (const char of seed) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0 }
  return () => {
    h = (h + 0x6D2B79F5) >>> 0
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(list, random) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const pairKey = (a, b) => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`)

function forEachPair(list, callback) {
  for (let i = 0; i < list.length; i += 1) for (let j = i + 1; j < list.length; j += 1) callback(list[i], list[j])
}

function crossPairs(left, right, callback) {
  for (const a of left) for (const b of right) callback(a, b)
}

// Les prénoms des confirmés, accompagnants compris. Un accompagnant sans prénom devient « Ana (2) ».
export function playerNames(participants = []) {
  const names = participants
    .filter(p => p.rsvp_status === 'Confirmé')
    .flatMap(p => {
      const main = String(p.participant_name || '').trim()
      if (!main) return []
      let companions = []
      try {
        const parsed = JSON.parse(p.commentaire || '{}')
        if (Array.isArray(parsed.accompagnants)) companions = parsed.accompagnants.map(name => String(name || '').trim()).filter(Boolean)
      } catch { /* ancien commentaire texte : seul l'invité est connu */ }
      const expected = Math.max(1, Number(p.nb_personnes) || 1) - 1
      for (let i = companions.length; i < expected; i += 1) companions.push(`${main} (${i + 2})`)
      return [main, ...companions]
    })
  // Deux joueurs du même prénom restent distinguables dans la grille.
  const seen = new Map()
  return names.map(name => {
    const count = (seen.get(name) || 0) + 1
    seen.set(name, count)
    return count === 1 ? name : `${name} (${count})`
  })
}

function meleeSchedule(names, { team, courtCount, rotations }) {
  const playersPerMatch = team * 2
  const matchesPerRound = Math.min(courtCount, Math.floor(names.length / playersPerMatch))
  const playing = matchesPerRound * playersPerMatch
  const restCount = names.length - playing
  const random = seededRandom(`${names.join('|')}#${team}#${courtCount}`)
  const partners = new Map()
  const opponents = new Map()
  const rests = new Map(names.map(name => [name, 0]))
  const order = new Map(names.map((name, index) => [name, index]))
  const count = (map, a, b) => map.get(pairKey(a, b)) || 0
  const bump = (map, a, b) => map.set(pairKey(a, b), count(map, a, b) + 1)

  const rounds = []
  for (let r = 0; r < rotations; r += 1) {
    // Repos : ceux qui se sont le moins reposés, puis un roulement par rotation.
    const turn = name => (((order.get(name) - r * restCount) % names.length) + names.length) % names.length
    const resting = [...names]
      .sort((a, b) => rests.get(a) - rests.get(b) || turn(a) - turn(b))
      .slice(0, restCount)
    const active = names.filter(name => !resting.includes(name))

    // Plusieurs tirages, on garde celui qui répète le moins de partenaires puis d'adversaires.
    let best = null
    for (let attempt = 0; attempt < ESSAIS_PAR_ROTATION; attempt += 1) {
      const drawn = shuffle(active, random)
      const matches = []
      let score = 0
      for (let m = 0; m < matchesPerRound; m += 1) {
        const slice = drawn.slice(m * playersPerMatch, (m + 1) * playersPerMatch)
        const equipes = [slice.slice(0, team), slice.slice(team)]
        equipes.forEach(eq => forEachPair(eq, (a, b) => { score += 100 * count(partners, a, b) }))
        crossPairs(equipes[0], equipes[1], (a, b) => { score += count(opponents, a, b) })
        matches.push({ court: m + 1, equipes })
      }
      if (!best || score < best.score) best = { score, matches }
      if (score === 0) break
    }

    best.matches.forEach(({ equipes }) => {
      equipes.forEach(eq => forEachPair(eq, (a, b) => bump(partners, a, b)))
      crossPairs(equipes[0], equipes[1], (a, b) => bump(opponents, a, b))
    })
    resting.forEach(name => rests.set(name, rests.get(name) + 1))
    rounds.push({ label: `Rotation ${r + 1}`, matches: best.matches, waiting: resting })
  }
  return rounds
}

function roundRobin(teams) {
  const pool = teams.map((_, index) => index)
  if (pool.length % 2) pool.push(null)
  const rounds = []
  for (let round = 0; round < pool.length - 1; round += 1) {
    const matches = []
    for (let i = 0; i < pool.length / 2; i += 1) {
      const left = pool[i]
      const right = pool[pool.length - 1 - i]
      if (left !== null && right !== null) matches.push([left, right])
    }
    rounds.push({ matches })
    pool.splice(1, 0, pool.pop())
  }
  return rounds
}

function fixedTeamsSchedule(names, { team, courtCount }) {
  const teamCount = Math.floor(names.length / team)
  const teams = Array.from({ length: teamCount }, (_, index) => names.slice(index * team, (index + 1) * team))
  const substitutes = names.slice(teamCount * team)
  const teamLabel = index => `Équipe ${index + 1}`
  // Tous les matchs du championnat, dans l'ordre du round-robin, puis rangés en créneaux :
  // à chaque créneau, on remplit les terrains avec les premiers matchs dont aucune équipe ne joue déjà.
  const pending = roundRobin(teams).flatMap(round => round.matches)
  const rounds = []
  while (pending.length) {
    const busy = new Set()
    const slice = []
    for (let i = 0; i < pending.length && slice.length < courtCount; ) {
      const [a, b] = pending[i]
      if (!busy.has(a) && !busy.has(b)) { slice.push(pending.splice(i, 1)[0]); busy.add(a); busy.add(b) } else i += 1
    }
    const idleTeams = teams.map((_, index) => index).filter(index => !busy.has(index))
    rounds.push({
      label: `Créneau ${rounds.length + 1}`,
      matches: slice.map(([a, b], court) => ({ court: court + 1, equipes: [teams[a], teams[b]], noms: [teamLabel(a), teamLabel(b)] })),
      waiting: [...idleTeams.map(teamLabel), ...substitutes],
    })
  }
  return { rounds, teams: teams.map((members, index) => ({ nom: teamLabel(index), joueurs: members })), substitutes }
}

export function buildTournamentSchedule({ players = [], format = 'melee', courts = 1, teamSize = 2, rounds = 4 } = {}) {
  const names = [...players]
  const team = Math.max(1, Math.round(Number(teamSize) || 2))
  const courtCount = Math.max(1, Math.round(Number(courts) || 1))
  const playersPerMatch = team * 2
  if (names.length < playersPerMatch) {
    return { rounds: [], waiting: names, reason: `Il faut au moins ${playersPerMatch} joueurs confirmés pour ce format (${names.length} pour l’instant).` }
  }

  if (format === 'equipes') {
    const { rounds: generated, teams, substitutes } = fixedTeamsSchedule(names, { team, courtCount })
    const matchCount = generated.reduce((sum, round) => sum + round.matches.length, 0)
    return { rounds: generated, waiting: [], teams, substitutes, matchCount, teamSize: team, courts: courtCount, format: 'equipes', players: names.length }
  }

  const rotations = Math.max(1, Math.min(MAX_ROTATIONS, Math.round(Number(rounds) || 4)))
  const generated = meleeSchedule(names, { team, courtCount, rotations })
  const matchCount = generated.reduce((sum, round) => sum + round.matches.length, 0)
  return { rounds: generated, waiting: [], matchCount, teamSize: team, courts: courtCount, format: 'melee', players: names.length }
}

// Texte prêt à partager (WhatsApp, SMS) : une ligne par match, sans émoji.
export function scheduleText(schedule, eventName = '') {
  if (!schedule?.rounds?.length) return ''
  const lines = [`Grille des rencontres${eventName ? ` — ${eventName}` : ''}`]
  if (schedule.format === 'equipes' && schedule.teams?.length) {
    lines.push('')
    schedule.teams.forEach(t => lines.push(`${t.nom} : ${t.joueurs.join(', ')}`))
  }
  schedule.rounds.forEach(round => {
    lines.push('', `*${round.label}*`)
    round.matches.forEach(match => {
      const [a, b] = match.noms || match.equipes.map(eq => eq.join(' + '))
      lines.push(`Terrain ${match.court} : ${a} contre ${b}`)
    })
    if (round.waiting?.length) lines.push(`Repos : ${round.waiting.join(', ')}`)
  })
  return lines.join('\n')
}
