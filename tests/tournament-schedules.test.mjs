import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTournamentSchedule, playerNames, scheduleText } from '../lib/tournament-schedules.mjs'

const joueurs = n => Array.from({ length: n }, (_, i) => `J${i + 1}`)
const key = (a, b) => [a, b].sort().join('|')

function partnerRepeats(schedule) {
  const seen = new Map()
  schedule.rounds.forEach(r => r.matches.forEach(m => m.equipes.forEach(eq => {
    for (let i = 0; i < eq.length; i += 1) for (let j = i + 1; j < eq.length; j += 1) seen.set(key(eq[i], eq[j]), (seen.get(key(eq[i], eq[j])) || 0) + 1)
  })))
  return [...seen.values()].filter(v => v > 1).length
}

test('mêlée en doublettes : 12 joueurs, 3 terrains, 4 rotations, partenaires presque jamais répétés', () => {
  const s = buildTournamentSchedule({ players: joueurs(12), format: 'melee', courts: 3, teamSize: 2, rounds: 4 })
  assert.equal(s.rounds.length, 4)
  s.rounds.forEach(r => {
    assert.equal(r.matches.length, 3)
    assert.equal(new Set(r.matches.flatMap(m => m.equipes.flat())).size, 12, 'chacun joue une seule fois par rotation')
  })
  assert.ok(partnerRepeats(s) <= 2, `partenaires répétés : ${partnerRepeats(s)}`)
})

test('mêlée en triplettes : 12 joueurs, 2 terrains, peu de répétitions', () => {
  const s = buildTournamentSchedule({ players: joueurs(12), format: 'melee', courts: 2, teamSize: 3, rounds: 4 })
  assert.equal(s.rounds[0].matches[0].equipes[0].length, 3)
  assert.ok(partnerRepeats(s) <= 6, `partenaires répétés : ${partnerRepeats(s)}`)
})

test('mêlée : le repos tourne, personne ne reste sur le banc tout le tournoi', () => {
  const s = buildTournamentSchedule({ players: joueurs(13), format: 'melee', courts: 3, teamSize: 2, rounds: 4 })
  const rested = s.rounds.flatMap(r => r.waiting)
  assert.equal(rested.length, 4)
  assert.equal(new Set(rested).size, 4, 'un joueur différent au repos à chaque rotation')
})

test('mêlée : même entrée, même grille', () => {
  const a = buildTournamentSchedule({ players: joueurs(12), format: 'melee', courts: 3, teamSize: 2 })
  const b = buildTournamentSchedule({ players: joueurs(12), format: 'melee', courts: 3, teamSize: 2 })
  assert.deepEqual(a, b)
})

test('équipes fixes : 8 équipes sur 2 terrains jouent bien leurs 28 matchs', () => {
  const s = buildTournamentSchedule({ players: joueurs(16), format: 'equipes', courts: 2, teamSize: 2 })
  assert.equal(s.matchCount, 28)
  assert.equal(s.teams.length, 8)
  assert.ok(s.rounds.every(r => r.matches.length <= 2))
  assert.equal(s.rounds[0].label, 'Créneau 1')
  assert.equal(s.rounds.length, 14, '28 matchs sur 2 terrains = 14 créneaux pleins')
  s.rounds.forEach(r => assert.equal(new Set(r.matches.flatMap(m => m.noms)).size, r.matches.length * 2, 'une équipe ne joue pas deux fois dans le même créneau'))
  const played = new Set(s.rounds.flatMap(r => r.matches.map(m => key(m.noms[0], m.noms[1]))))
  assert.equal(played.size, 28, 'chaque rencontre une seule fois')
})

test('équipes fixes : 4 triplettes sur 2 terrains = championnat complet en 3 tours', () => {
  const s = buildTournamentSchedule({ players: joueurs(12), format: 'equipes', courts: 2, teamSize: 3 })
  assert.equal(s.rounds.length, 3)
  assert.equal(s.matchCount, 6)
  assert.ok(s.rounds.every(r => r.matches.length === 2))
  assert.equal(s.rounds[0].matches[0].equipes[0].length, 3)
})

test('équipes fixes : nombre impair d’équipes et remplaçants', () => {
  const s = buildTournamentSchedule({ players: joueurs(11), format: 'equipes', courts: 3, teamSize: 2 })
  assert.equal(s.teams.length, 5)
  assert.deepEqual(s.substitutes, ['J11'])
  assert.equal(s.matchCount, 10)
  assert.ok(s.rounds.length <= 5, `créneaux : ${s.rounds.length}`)
})

test('pas assez de joueurs : message clair', () => {
  const s = buildTournamentSchedule({ players: joueurs(3), format: 'melee', teamSize: 2 })
  assert.match(s.reason, /au moins 4 joueurs/)
})

test('les confirmés et leurs accompagnants deviennent des joueurs, même sans prénom', () => {
  assert.deepEqual(playerNames([
    { participant_name: 'Ana', rsvp_status: 'Confirmé', nb_personnes: 2, commentaire: JSON.stringify({ accompagnants: ['Benoît'] }) },
    { participant_name: 'Cam', rsvp_status: 'Refusé' },
    { participant_name: 'Dan', rsvp_status: 'Confirmé', nb_personnes: 3, commentaire: '' },
    { participant_name: 'Ana', rsvp_status: 'Confirmé', nb_personnes: 1 },
  ]), ['Ana', 'Benoît', 'Dan', 'Dan (2)', 'Dan (3)', 'Ana (2)'])
})

test('texte de partage lisible', () => {
  const s = buildTournamentSchedule({ players: joueurs(8), format: 'equipes', courts: 2, teamSize: 2 })
  const text = scheduleText(s, 'Tournoi du club')
  assert.match(text, /^Grille des rencontres — Tournoi du club/)
  assert.match(text, /Équipe 1 : J1, J2/)
  assert.match(text, /Terrain 1 : Équipe \d contre Équipe \d/)
})

test('les rencontres d’un joueur : partenaires, adversaires et repos', async () => {
  const { playerMatches } = await import('../lib/tournament-schedules.mjs')
  const s = buildTournamentSchedule({ players: joueurs(13), format: 'melee', courts: 3, teamSize: 2, rounds: 4 })
  const mine = playerMatches(s, 'j5')
  assert.equal(mine.length, 4)
  const played = mine.filter(m => !m.rest)
  played.forEach(m => { assert.equal(m.partners.length, 1); assert.equal(m.opponents.length, 2) })
  assert.ok(mine.filter(m => m.rest).length <= 1)
  const teams = buildTournamentSchedule({ players: joueurs(8), format: 'equipes', courts: 2, teamSize: 2 })
  const t = playerMatches(teams, 'J1').filter(m => !m.rest)
  assert.equal(t.length, 3, 'en 4 équipes, chaque équipe joue 3 matchs')
  assert.match(t[0].opponents[0], /^Équipe \d \(J\d+, J\d+\)$/)
})
