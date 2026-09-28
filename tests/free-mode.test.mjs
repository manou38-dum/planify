import test from 'node:test'
import assert from 'node:assert/strict'
import { parseFreeEvent, freeLists } from '../lib/free-mode.mjs'

test('reported conversation accumulates place, name, date and time', () => {
  let state = parseFreeEvent('bbq samedi chez moi a chambery', {}, '2026-09-27')
  assert.equal(state.location, 'chez moi a chambery')
  assert.equal(state.date, '2026-10-03T00:00')
  state = { ...state, ...parseFreeEvent('numa le 19 octobre', state, '2026-09-27') }
  assert.equal(state.organizer_name, 'numa')
  assert.equal(state.date, '2026-10-19T00:00')
  state = { ...state, ...parseFreeEvent('a 14H', state, '2026-09-27') }
  assert.equal(state.date, '2026-10-19T14:00')
  assert.equal(state.follow_up_question, null)
})
test('time alone never invents a date, invalid dates are rejected', () => {
  assert.equal(parseFreeEvent('a 14H', {}, '2026-09-27').date, undefined)
  assert.equal(parseFreeEvent('31 fevrier', {}, '2026-09-27').date, undefined)
  assert.equal(parseFreeEvent('bonjour', {}, '2026-09-27').organizer_name, undefined)
})
test('lists respect selection, vegetarian choice, and dessert option', () => {
  const data = freeLists(['menu'], 8, { vegetarien: true }, 'BBQ')
  assert.equal(data.lists.length, 1)
  assert.ok(data.lists[0].items.some(i => i.item_name.includes('végétales')))
  assert.ok(!data.lists[0].items.some(i => /viande|dessert/i.test(i.item_name)))
  assert.equal(freeLists(['planning'], 8).lists.length, 0)
})
