// Grilles simples pour rencontres amicales : aucune donnée sensible ni appel externe.
function rotate(players, offset) {
  const count = players.length
  return players.map((_, index) => players[(index + offset) % count])
}

function pairRounds(teams) {
  const pool = [...teams]
  if (pool.length % 2) pool.push(null)
  const rounds = []
  for (let round = 0; round < pool.length - 1; round += 1) {
    const matches = []
    for (let i = 0; i < pool.length / 2; i += 1) {
      const left = pool[i]
      const right = pool[pool.length - 1 - i]
      if (left && right) matches.push([left, right])
    }
    rounds.push(matches)
    pool.splice(1, 0, pool.pop())
  }
  return rounds
}

export function playerNames(participants = []) {
  return participants
    .filter(p => p.rsvp_status === 'Confirmé')
    .flatMap(p => {
      const names = [p.participant_name]
      try {
        const parsed = JSON.parse(p.commentaire || '{}')
        if (Array.isArray(parsed.accompagnants)) names.push(...parsed.accompagnants)
      } catch { /* ancien commentaire texte : seul l'invité est connu */ }
      return names
    })
    .map(name => String(name || '').trim())
    .filter(Boolean)
}

export function buildTournamentSchedule({ players = [], format = 'melee', courts = 1, teamSize = 2, rounds = 4 } = {}) {
  const names = [...players]
  const team = Math.max(1, Math.round(Number(teamSize) || 2))
  const courtCount = Math.max(1, Math.round(Number(courts) || 1))
  const playersPerMatch = team * 2
  const usable = Math.floor(names.length / playersPerMatch) * playersPerMatch
  const active = names.slice(0, usable)
  const waiting = names.slice(usable)
  if (active.length < playersPerMatch) return { rounds: [], waiting: names, reason: `Il faut au moins ${playersPerMatch} joueurs confirmés pour ce format.` }

  if (format === 'equipes') {
    const teams = []
    for (let index = 0; index < active.length; index += team) teams.push(active.slice(index, index + team))
    const generated = pairRounds(teams).map((matches, index) => ({
      label: `Tour ${index + 1}`,
      matches: matches.slice(0, courtCount).map((match, court) => ({ court: court + 1, equipes: match })),
      waiting: [...waiting, ...matches.slice(courtCount).flatMap(match => match.flat())],
    }))
    return { rounds: generated, waiting: [], teamSize: team, format: 'equipes' }
  }

  const generated = Array.from({ length: Math.max(1, Math.min(8, Number(rounds) || 4)) }, (_, index) => {
    const rotated = rotate(active, index)
    const matches = []
    for (let court = 0; court < courtCount; court += 1) {
      const slice = rotated.slice(court * playersPerMatch, (court + 1) * playersPerMatch)
      if (slice.length === playersPerMatch) matches.push({ court: court + 1, equipes: [slice.slice(0, team), slice.slice(team)] })
    }
    const used = matches.flatMap(match => match.equipes.flat())
    return { label: `Rotation ${index + 1}`, matches, waiting: [...waiting, ...active.filter(name => !used.includes(name))] }
  })
  return { rounds: generated, waiting: [], teamSize: team, format: 'melee' }
}