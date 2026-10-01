import test from 'node:test'
import assert from 'node:assert/strict'
import { SPORT_FORMATS, findSportFormat, formatChoices, placeWord } from '../lib/tournament-formats.mjs'
import { matchSportActivity } from '../lib/activity-planning.mjs'
import { scheduleText, buildTournamentSchedule } from '../lib/tournament-schedules.mjs'

test('le sport saisi librement retrouve ses formats', () => {
  assert.equal(findSportFormat('foot')?.key, 'football')
  assert.equal(findSportFormat('Tournoi de pétanque du club')?.key, 'petanque')
  assert.equal(findSportFormat('belote')?.key, 'cartes')
  assert.equal(findSportFormat('ping-pong')?.key, 'tennis_table')
  assert.equal(findSportFormat('beach volley')?.key, 'beach_volley')
  assert.equal(findSportFormat('curling'), null)
})

test('chaque format a un choix par défaut cohérent', () => {
  for (const s of SPORT_FORMATS) {
    assert.ok(s.sizes.some(size => size.n === s.defaultSize), s.key)
    assert.ok(['melee', 'equipes'].includes(s.defaultFormat), s.key)
  }
})

test('le libellé du sport reste reconnu par le planning des bénévoles', () => {
  for (const label of ['Pétanque', 'Football', 'Basket', 'Volley', 'Padel', 'Tennis', 'Badminton', 'Handball', 'Mölkky', 'Échecs']) {
    assert.ok(matchSportActivity(label), label)
  }
})

test('les libellés de jeu s’adaptent aux sports individuels', () => {
  assert.match(formatChoices(1)[0].title, /adversaire/)
  assert.match(formatChoices(2)[0].title, /Équipes tirées au sort/)
  assert.equal(placeWord(['table', 'tables'], 1), 'table')
  assert.equal(placeWord(['table', 'tables'], 3), 'tables')
})

test('le partage utilise le mot du lieu de jeu', () => {
  const s = buildTournamentSchedule({ players: ['A', 'B', 'C', 'D'], format: 'equipes', courts: 2, teamSize: 1 })
  assert.match(scheduleText(s, 'Échecs du jeudi', ['table', 'tables']), /Table 1 : [A-D] contre [A-D]/)
})
