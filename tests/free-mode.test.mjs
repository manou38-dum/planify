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
  assert.match(state.follow_up_question, /nombre de personnes/)
  state = { ...state, ...parseFreeEvent('12', state, '2026-09-27') }
  assert.equal(state.nb_participants, 12)
  assert.equal(state.follow_up_question, null)
})

test('BBQ quantities scale with guests, packages round up and shared equipment stays fixed', () => {
  const lists = freeLists(['menu', 'boissons', 'materiel'], 20, { desserts: true }, 'BBQ').lists
  const items = lists.flatMap(l => l.items)
  const quantity = name => items.find(i => i.item_name.startsWith(name)).quantity
  assert.equal(quantity('Assortiment'), 5)
  assert.equal(quantity('Salade'), 3)
  assert.equal(quantity('Crudités'), 2)
  assert.equal(quantity('Pain'), 5)
  assert.equal(quantity('Eau'), 14)
  assert.equal(quantity('Assiettes'), 22)
  assert.equal(quantity('Pinces'), 2)
  assert.equal(quantity('Dessert'), 20)
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

test('calculation summary only mentions barbecue for a BBQ and only for chosen lists', () => {
  for (const type of ['Soirée', 'Anniversaire', 'Match/Tournoi', 'Randonnée', 'Autre']) {
    const { menu_resume } = freeLists(['menu', 'boissons', 'materiel'], 12, {}, type)
    assert.doesNotMatch(menu_resume, /grillade|barbecue|BBQ/i, type)
    assert.match(menu_resume, /Base pour 12 personnes/)
  }
  assert.match(freeLists(['menu', 'materiel'], 12, {}, 'BBQ').menu_resume, /grillades.*barbecue/s)
  assert.equal(freeLists(['planning'], 12, {}, 'Match/Tournoi').menu_resume, '')
  assert.equal(freeLists(['cadeaux'], 12, {}, 'Anniversaire').menu_resume, '')
  assert.doesNotMatch(freeLists(['boissons'], 12, {}, 'Soirée').menu_resume, /Repas|Vaisselle/)
})
