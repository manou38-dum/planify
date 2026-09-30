import test from 'node:test'
import assert from 'node:assert/strict'
import { invitationHook, invitationMessage, listeManques } from '../lib/invitation.mjs'

const base = { organizer_name: 'Manu', event_name: 'Chez Manu', date: '2026-10-03T12:15:00Z', location: 'Au jardin', invite_link_id: 'abc', deadline_rsvp: '2026-10-01T10:00:00Z' }
const TYPES = ['BBQ', 'Apero', 'Anniversaire', 'Soirée', 'Randonnée', 'Match/Tournoi', 'Autre']
const PROMESSES = /sms automatique|paiement|payer|cagnotte|rappel automatique|automatiquement|on te rappellera/i
const EMOJI = /\p{Extended_Pictographic}/u

test('each type has a short, warm hook ending with a question', () => {
  for (const event_type of TYPES) {
    const hook = invitationHook({ ...base, event_type, event_options: {} })
    assert.ok(hook.length <= 90, `${event_type}: ${hook.length}`)
    assert.ok(hook.endsWith('?'), event_type)
    assert.doesNotMatch(hook, EMOJI)
    assert.doesNotMatch(hook, PROMESSES)
  }
  assert.match(invitationHook({ ...base, event_type: 'Anniversaire', event_options: { pour_qui: 'Léa' } }), /Léa/)
  assert.match(invitationHook({ ...base, event_type: 'Randonnée', event_options: { activite: 'VTT' } }), /sortie VTT/)
  assert.equal(invitationHook({ ...base, event_type: 'BBQ', event_options: { invitation_hook: 'Mon texte à moi' } }), 'Mon texte à moi')
})

test('WhatsApp messages stay short, honest and end with the link', () => {
  for (const event_type of TYPES) {
    for (const extra of [{}, { anniv_type: 'enfant' }, { surprise: true, pour_qui: 'Léa' }]) {
      const { text, url } = invitationMessage({ ...base, event_type, event_options: extra }, 'https://planify.manoulabs.com')
      const lines = text.split('\n')
      assert.equal(lines.at(-1), url)
      assert.equal((text.match(/https:\/\//g) || []).length, 1)
      assert.ok(text.length < 400, `${event_type}: ${text.length}`)
      assert.doesNotMatch(text, EMOJI)
      assert.doesNotMatch(text, PROMESSES)
    }
  }
  const tournoi = invitationMessage({ ...base, event_type: 'Match/Tournoi', event_options: {} }, 'https://x').text
  assert.doesNotMatch(tournoi, /apporte/)
  assert.match(invitationMessage({ ...base, event_type: 'BBQ', event_options: {} }, 'https://x').text, /choisis ce que tu apportes/)
})

test('missing items are listed briefly', () => {
  assert.equal(listeManques(['a', 'b']), 'a, b')
  assert.equal(listeManques(['a', 'b', 'c', 'd', 'e', 'f']), 'a, b, c, d et 2 autres')
  assert.equal(listeManques(['a', 'b', 'c', 'd', 'e']), 'a, b, c, d et 1 autre')
})

test('outdoor invitation: clean activity name, gear call to action, no repeated preview', async () => {
  const { invitationMessage, invitationPreviewText, invitationHook } = await import('../lib/invitation.mjs')
  const ev = { ...base, event_type: 'Randonnée', event_name: 'thomas', organizer_name: 'numi', event_options: { activite: 'RANDONNEE', selected_lists: { checklist: true } } }
  const { text } = invitationMessage(ev, 'https://x')
  assert.match(text, /^numi t’invite : \*thomas\*\n/)
  assert.equal((text.match(/thomas/g) || []).length, 1)
  assert.match(text, /Une randonnée au grand air/)
  assert.doesNotMatch(text, /RANDONNEE|apportes/)
  assert.match(text, /coche ton matériel/)
  assert.match(invitationHook({ ...ev, event_options: { activite: 'VTT' } }), /sortie VTT/)
  assert.match(invitationHook({ ...ev, event_options: { activite: 'Parapente' } }), /sortie parapente/)
  const preview = invitationPreviewText(ev)
  assert.doesNotMatch(preview, /grand air|octobre|thomas/)
})
