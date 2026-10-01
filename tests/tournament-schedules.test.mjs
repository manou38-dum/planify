import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTournamentSchedule, playerNames } from '../lib/tournament-schedules.mjs'

test('a 12-player padel mêlée uses three courts and rotates partners', () => {
  const players = Array.from({ length: 12 }, (_, i) => `J${i + 1}`)
  const schedule = buildTournamentSchedule({ players, format: 'melee', courts: 3, teamSize: 2, rounds: 4 })
  assert.equal(schedule.rounds.length, 4)
  assert.equal(schedule.rounds[0].matches.length, 3)
  assert.deepEqual(schedule.rounds[0].matches[0].equipes, [['J1', 'J2'], ['J3', 'J4']])
  assert.deepEqual(schedule.rounds[1].matches[0].equipes, [['J2', 'J3'], ['J4', 'J5']])
})

test('four pétanque triplettes play a complete short championship', () => {
  const players = Array.from({ length: 12 }, (_, i) => `J${i + 1}`)
  const schedule = buildTournamentSchedule({ players, format: 'equipes', courts: 2, teamSize: 3 })
  assert.equal(schedule.rounds.length, 3)
  assert.equal(schedule.rounds[0].matches.length, 2)
  assert.equal(schedule.rounds[0].matches[0].equipes[0].length, 3)
})

test('confirmed guests and named companions become players', () => {
  assert.deepEqual(playerNames([{ participant_name: 'Ana', rsvp_status: 'Confirmé', commentaire: JSON.stringify({ accompagnants: ['Benoît'] }) }, { participant_name: 'Cam', rsvp_status: 'Refusé' }]), ['Ana', 'Benoît'])
})