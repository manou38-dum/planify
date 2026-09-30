import test from 'node:test'
import assert from 'node:assert/strict'
import { ACTIVITES, matchSportActivity, activityPlanning } from '../lib/activity-planning.mjs'

test('free text is matched to the right activity', () => {
  const cases = { 'VTT': 'vtt', 'Rando VTT dimanche': 'vtt', 'Foot à 5': 'football', 'Ping-pong': 'tennis_table', 'padel': 'padel', 'Stand up paddle': 'kayak_canoe', 'Pétanque': 'petanque', 'belote': 'cartes' }
  for (const [text, cle] of Object.entries(cases)) assert.equal(matchSportActivity(text)?.cle, cle, text)
  assert.equal(matchSportActivity('curling'), null)
  assert.equal(matchSportActivity(''), null)
})

test('VTT never proposes nets or pitch setup', () => {
  const names = activityPlanning('VTT', '10:00', 20).map(p => `${p.slot_name} ${p.description}`).join(' ')
  assert.doesNotMatch(names, /filet|terrain|arbitr|buvette/i)
  assert.match(names, /Balisage/)
})

test('unknown sport keeps prefilled posts marked to fill in', () => {
  const postes = activityPlanning('curling', '14:00', 12)
  assert.ok(postes.length >= 2)
  assert.ok(postes.every(p => p.description.startsWith('À remplir')))
})

test('meal, installation and headcount options', () => {
  assert.ok(!activityPlanning('randonnee', '09:00', 10).some(p => /Goûter/.test(p.slot_name)))
  assert.ok(activityPlanning('randonnee', '09:00', 10, { repas_enabled: true }).some(p => /Goûter/.test(p.slot_name)))
  const vtt = activityPlanning('vtt', '09:00', 10, { repas_enabled: true })
  assert.equal(vtt.find(p => /Repas/.test(p.slot_name)).start_time, '11:15')
  assert.ok(activityPlanning('foot', '14:00', 24, { repas_enabled: true }).some(p => /Buvette/.test(p.slot_name)))
  assert.ok(!activityPlanning('vtt', '09:00', 10, { aide_installation: false }).some(p => /Balisage/.test(p.slot_name)))
  assert.equal(activityPlanning('foot', '14:00', 40).find(p => /Arbitrage/.test(p.slot_name)).max_participants, 4)
  assert.deepEqual(activityPlanning('foot', null, 10), [])
})

test('table is consistent', () => {
  for (const a of ACTIVITES) {
    assert.ok(a.postes.length >= 2 && a.postes.length <= 6, a.cle)
    for (const p of a.postes) {
      assert.ok(p.duree_minutes >= 15 && p.duree_minutes <= 360, `${a.cle} ${p.nom_poste}`)
      assert.ok(p.min_benevoles >= 1)
      assert.doesNotMatch(p.nom_poste + p.description, /\p{Extended_Pictographic}/u)
    }
  }
})
