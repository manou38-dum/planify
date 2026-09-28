import test from 'node:test'
import assert from 'node:assert/strict'
import { invitationMessage } from '../lib/invitation.mjs'
import { freeLists } from '../lib/free-mode.mjs'
import { menuInspiration } from '../lib/menu-inspirations.mjs'

test('sharing excludes internal calculation notes, even for existing events', () => {
  const { text } = invitationMessage({ organizer_name: 'Manu', event_name: 'BBQ entre amis', date: '2026-10-03T12:15:00Z', location: 'Au jardin', invite_link_id: 'test', event_options: { menu_resume: 'Base pour 24 personnes : 250 g. Mode gratuit sans IA.' } }, 'https://planify.manoulabs.com')
  assert.ok(text.includes('14:15'))
  assert.ok(text.includes('BBQ entre amis'))
  assert.ok(!text.includes('250 g'))
  assert.ok(!text.includes('sans IA'))
  assert.equal((text.match(/https:\/\//g) || []).length, 1)
  assert.ok(text.length < 350)
})

test('chosen recipe inspiration changes the dishes without losing portion calibration', () => {
  const data = freeLists(['menu'], 20, { menu_style: 'mediterraneen', vegetarien: true }, 'BBQ')
  assert.ok(data.lists[0].items.some(i => /courgettes/.test(i.item_name) && i.quantity === 3))
  assert.ok(data.lists[0].items.some(i => /Brochettes de légumes/.test(i.item_name) && i.quantity === 2))
  assert.ok(!data.lists[0].items.some(i => /grillades/.test(i.item_name)))
  assert.equal(menuInspiration({ menu_style: 'inconnu' }).label, 'Simple et classique')
})
