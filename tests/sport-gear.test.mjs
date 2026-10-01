import test from 'node:test'
import assert from 'node:assert/strict'
import { personalGearList, sharedGearList } from '../lib/sport-gear.mjs'
import { freeLists } from '../lib/free-mode.mjs'

test('tennis : matériel de chacun = raquette et chaussures, pas de vaisselle', () => {
  const perso = personalGearList('Tennis')
  assert.equal(perso.behavior, 'checklist')
  assert.ok(perso.items.some(i => /Raquette de tennis/.test(i.item_name)))
  assert.ok(perso.items.some(i => /Chaussures de tennis/.test(i.item_name)))
  const { lists, menu_resume } = freeLists(['materiel'], 16, { sport: 'Tennis', court_count: 4 }, 'Match/Tournoi')
  assert.equal(lists.length, 1)
  assert.equal(lists[0].list_name, 'Matériel commun à apporter')
  assert.ok(lists[0].items.some(i => /balles de tennis/.test(i.item_name) && i.quantity === 8))
  assert.ok(!lists[0].items.some(i => /Assiettes|Verres|Couverts|Serviettes/.test(i.item_name)))
  assert.doesNotMatch(menu_resume, /Vaisselle/)
  assert.match(lists[0].description, /4 courts/)
})

test('football : ballons et chasubles selon le nombre de terrains', () => {
  const shared = sharedGearList('foot', 2)
  assert.ok(shared.items.some(i => i.item_name === 'Ballons' && i.quantity === 3))
  assert.ok(shared.items.some(i => i.item_name === 'Jeux de chasubles' && i.quantity === 2))
})

test('belote : pas de liste de matériel personnel', () => {
  assert.equal(personalGearList('belote'), null)
})

test('sport inconnu : liste générique à préciser', () => {
  assert.ok(personalGearList('curling').items.length > 0)
  assert.match(sharedGearList('curling', 1).items[0].item_name, /à préciser/)
})

test('un tournoi sans liste cochée ne reçoit aucune liste', () => {
  assert.equal(freeLists([], 20, { sport: 'Tennis' }, 'Match/Tournoi').lists.length, 0)
})

test('un barbecue garde sa vaisselle', () => {
  const { lists } = freeLists(['materiel'], 10, {}, 'BBQ')
  assert.ok(lists[0].items.some(i => /Assiettes/.test(i.item_name)))
})
