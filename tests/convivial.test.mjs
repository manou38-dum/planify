import test from 'node:test'
import assert from 'node:assert/strict'
import { freeLists } from '../lib/free-mode.mjs'
import { invitationMessage } from '../lib/invitation.mjs'
import { calendarEvent } from '../lib/calendar.mjs'
import { quantityReview } from '../lib/quantity-review.mjs'
const event = { id: 'test', invite_link_id: 'test', event_name: 'BBQ', organizer_name: 'Camille', event_type: 'BBQ', nb_participants: 12, date: '2026-10-03T12:00:00Z', event_options: {} }
test('generous food portions leave drinks and equipment unchanged', () => {
 const normal = freeLists(['menu','boissons','materiel'],12,{},'BBQ').lists
 const generous = freeLists(['menu','boissons','materiel'],12,{appetite:'generous'},'BBQ').lists
 assert.equal(generous[0].items[0].quantity,3.9)
 assert.deepEqual(generous.slice(1),normal.slice(1))
})
test('companions increase suggestions, reservations and custom articles are preserved', () => {
 const items = [{ item_name:'Pain',unit:'baguettes de 250 g',quantity:2,status:'Réservé' },{ item_name:'Pain',unit:'baguettes de 250 g',quantity:1,status:'Disponible' },{item_name:'Mon gâteau',unit:'parts',quantity:1}]
 const before = JSON.stringify(items)
 const review = quantityReview(event,[{rsvp_status:'Confirmé',nb_personnes:14},{rsvp_status:'Peut-être',nb_personnes:6}],items)
 assert.equal(review.people,14)
 assert.equal(review.additions.length,1)
 assert.equal(review.additions[0].quantity,1)
 assert.equal(JSON.stringify(items),before)
 assert.equal(quantityReview(event,[],items).people,12)
})
test('calendar includes both alarms, Paris summer-time equivalent UTC and safely folded accents', () => {
 const result = calendarEvent({...event,event_name:'été '.repeat(60)+'; test'},'https://planify.manoulabs.com')
 assert.match(result,/DTSTART:20261003T120000Z/)
 assert.match(result,/TRIGGER:-P1D/)
 assert.match(result,/TRIGGER:-PT2H/)
 assert.ok(result.split('\r\n').every(line=>Buffer.byteLength(line)<=75))
 assert.equal((result.match(/BEGIN:VEVENT/g)||[]).length,1)
})
test('share uses personal hook and no broken emoji or calculation notes', () => {
 const {text} = invitationMessage({...event,event_options:{invitation_hook:'Venez avec votre bonne humeur !',menu_resume:'SECRET'}},'https://planify.manoulabs.com')
 assert.match(text,/Venez avec votre bonne humeur/)
 assert.doesNotMatch(text,/SECRET|�|🎉|📅/)
})
